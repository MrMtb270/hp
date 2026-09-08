"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { conceptKey, DEFAULT_RATING, nextReviewInterval, pickNextQuestions, updateElo } from "@/lib/adaptive";
import { awardXp, checkAndUnlockAchievements, recordPersonalRecordIfAny, touchDailyStreak } from "@/lib/gamify-server";
import { computeEstimate } from "@/lib/estimate";
import { XP } from "@/lib/gamification";
import type { ErrorReason, SessionType, Subtest } from "@prisma/client";

export type SanitizedQuestion = {
  id: string;
  subtest: string;
  concept: string;
  stem: string;
  options: string[];
  difficulty: number;
};

function sanitize(q: { id: string; subtest: string; concept: string; stem: string; options: string; difficulty: number }): SanitizedQuestion {
  return { id: q.id, subtest: q.subtest, concept: q.concept, stem: q.stem, options: JSON.parse(q.options), difficulty: q.difficulty };
}

export async function startSession(input: {
  type: SessionType;
  subtests?: string[] | null;
  plannedMinutes?: number;
  questionCount?: number;
  onlyDue?: boolean;
}) {
  const user = await requireUser();
  const count = input.questionCount ?? Math.max(3, Math.round((input.plannedMinutes ?? 10) / 1.4));

  const where = input.subtests && input.subtests.length > 0 ? { subtest: { in: input.subtests as Subtest[] } } : {};
  const [allQuestions, masteries, recentAttempts] = await Promise.all([
    prisma.question.findMany({ where }),
    prisma.conceptMastery.findMany({ where: { userId: user.id } }),
    prisma.questionAttempt.findMany({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3 * 3600000) } },
      select: { questionId: true },
    }),
  ]);

  const ratingMap: Record<string, number> = {};
  const dueKeys = new Set<string>();
  const now = new Date();
  for (const m of masteries) {
    ratingMap[conceptKey(m.subtest, m.concept)] = m.rating;
    if (m.nextReviewAt && m.nextReviewAt <= now) dueKeys.add(conceptKey(m.subtest, m.concept));
  }

  const excludeIds = new Set(recentAttempts.map((a) => a.questionId));
  let candidates = allQuestions.map((q) => ({ id: q.id, subtest: q.subtest, concept: q.concept, difficulty: q.difficulty }));
  if (input.onlyDue) {
    candidates = candidates.filter((c) => dueKeys.has(conceptKey(c.subtest, c.concept)));
  }
  let picked = pickNextQuestions(candidates, ratingMap, dueKeys, count, excludeIds);
  if (picked.length < count) {
    picked = pickNextQuestions(candidates, ratingMap, dueKeys, count, new Set());
  }

  const pickedIds = new Set(picked.map((p) => p.id));
  const fullPicked = allQuestions.filter((q) => pickedIds.has(q.id));
  // bevara adaptiv ordning
  fullPicked.sort((a, b) => picked.findIndex((p) => p.id === a.id) - picked.findIndex((p) => p.id === b.id));

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      type: input.type,
      subtestFocus: input.subtests ? JSON.stringify(input.subtests) : null,
      plannedMinutes: input.plannedMinutes,
      questionsTotal: fullPicked.length,
    },
  });

  await touchDailyStreak(user.id);

  return {
    sessionId: session.id,
    questions: fullPicked.map(sanitize),
  };
}

export async function submitAnswer(input: {
  sessionId: string;
  questionId: string;
  selectedIndex: number;
  timeSpentSec: number;
  errorReason?: ErrorReason;
  hintsUsed?: number;
}) {
  const user = await requireUser();
  const question = await prisma.question.findUniqueOrThrow({ where: { id: input.questionId } });
  const correct = input.selectedIndex === question.correctIndex;

  await prisma.questionAttempt.create({
    data: {
      userId: user.id,
      questionId: input.questionId,
      sessionId: input.sessionId,
      selectedIndex: input.selectedIndex,
      correct,
      timeSpentSec: input.timeSpentSec,
      errorReason: correct ? null : input.errorReason,
      hintsUsed: input.hintsUsed ?? 0,
    },
  });

  const newAvgTime =
    question.timesAnswered === 0 ? input.timeSpentSec : (question.avgSolveTimeSec * question.timesAnswered + input.timeSpentSec) / (question.timesAnswered + 1);
  await prisma.question.update({
    where: { id: question.id },
    data: { timesAnswered: { increment: 1 }, timesCorrect: { increment: correct ? 1 : 0 }, avgSolveTimeSec: newAvgTime },
  });

  const mastery = await prisma.conceptMastery.findUnique({ where: { userId_subtest_concept: { userId: user.id, subtest: question.subtest, concept: question.concept } } });
  const priorRating = mastery?.rating ?? DEFAULT_RATING;
  const newRating = updateElo(priorRating, question.difficulty, correct);
  const priorInterval = mastery?.nextReviewAt && mastery.lastSeenAt ? (mastery.nextReviewAt.getTime() - mastery.lastSeenAt.getTime()) / 86400000 : 0;
  const intervalDays = nextReviewInterval(correct, priorInterval);
  const nextReviewAt = new Date(Date.now() + intervalDays * 86400000);

  await prisma.conceptMastery.upsert({
    where: { userId_subtest_concept: { userId: user.id, subtest: question.subtest, concept: question.concept } },
    update: { rating: newRating, attempts: { increment: 1 }, correct: { increment: correct ? 1 : 0 }, lastSeenAt: new Date(), nextReviewAt },
    create: {
      userId: user.id,
      subtest: question.subtest,
      concept: question.concept,
      rating: newRating,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastSeenAt: new Date(),
      nextReviewAt,
    },
  });

  const xpResult = await awardXp(user.id, correct ? XP.CORRECT_ANSWER : XP.INCORRECT_ANSWER, correct ? "correct_answer" : "incorrect_answer");

  return {
    correct,
    correctIndex: question.correctIndex,
    explanationShort: question.explanationShort,
    xpEarned: xpResult.xpAwarded,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
  };
}

export async function completeSession(sessionId: string) {
  const user = await requireUser();
  const attempts = await prisma.questionAttempt.findMany({ where: { sessionId } });
  const questionsCorrect = attempts.filter((a) => a.correct).length;
  const totalTime = attempts.reduce((sum, a) => sum + a.timeSpentSec, 0);

  await prisma.studySession.update({
    where: { id: sessionId },
    data: { completedAt: new Date(), questionsCorrect, questionsTotal: attempts.length },
  });

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
  await prisma.profile.update({ where: { userId: user.id }, data: { totalStudySeconds: { increment: totalTime } } });

  const sessionXp = await awardXp(user.id, XP.SESSION_COMPLETE, "session_complete");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAttempts = await prisma.questionAttempt.count({ where: { userId: user.id, createdAt: { gte: todayStart } } });
  const dailyGoal = 15;
  let dailyGoalXp = 0;
  if (todayAttempts >= dailyGoal && todayAttempts - attempts.length < dailyGoal) {
    const res = await awardXp(user.id, XP.DAILY_GOAL, "daily_goal");
    dailyGoalXp = res.xpAwarded;
  }

  const estimate = await computeEstimate(user.id);
  const previousEstimate = profile.currentEstimate;
  await prisma.profile.update({ where: { userId: user.id }, data: { currentEstimate: estimate.total } });
  const isPr = await recordPersonalRecordIfAny(user.id, estimate.total);

  const newAchievements = await checkAndUnlockAchievements(user.id, { justCompletedSessionId: sessionId });

  return {
    questionsCorrect,
    questionsTotal: attempts.length,
    xpEarned: sessionXp.xpAwarded + dailyGoalXp,
    dailyGoalReached: dailyGoalXp > 0,
    previousEstimate,
    newEstimate: estimate.total,
    isPersonalRecord: isPr,
    newAchievements: newAchievements.map((a) => ({ code: a.code, name: a.name, icon: a.icon, description: a.description })),
  };
}
