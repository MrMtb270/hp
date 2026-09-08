"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { conceptKey, DEFAULT_RATING, nextReviewInterval, updateElo } from "@/lib/adaptive";
import { awardXp, checkAndUnlockAchievements, recordPersonalRecordIfAny } from "@/lib/gamify-server";
import { computeEstimate } from "@/lib/estimate";
import { XP } from "@/lib/gamification";
import { aiService } from "@/lib/ai/AIService";
import { isVerbal, subtestLabel } from "@/lib/utils";

export async function listAvailableTests() {
  await requireUser();
  return prisma.test.findMany({ where: { isDemo: true }, include: { _count: { select: { questions: true } } } });
}

export async function startTestAttempt(testId: string) {
  const user = await requireUser();
  const testQuestions = await prisma.testQuestion.findMany({
    where: { testId },
    orderBy: { order: "asc" },
    include: { question: true },
  });

  const attempt = await prisma.testAttempt.create({ data: { userId: user.id, testId } });

  return {
    attemptId: attempt.id,
    durationSec: Math.max(600, testQuestions.length * 90),
    questions: testQuestions.map((tq) => ({
      id: tq.question.id,
      subtest: tq.question.subtest,
      concept: tq.question.concept,
      stem: tq.question.stem,
      options: JSON.parse(tq.question.options) as string[],
    })),
  };
}

export async function submitTestAnswer(input: { attemptId: string; questionId: string; selectedIndex: number | null; timeSpentSec: number }) {
  const user = await requireUser();
  const attempt = await prisma.testAttempt.findFirstOrThrow({ where: { id: input.attemptId, userId: user.id } });
  const question = await prisma.question.findUniqueOrThrow({ where: { id: input.questionId } });
  const correct = input.selectedIndex !== null && input.selectedIndex === question.correctIndex;

  const existing = await prisma.testAnswer.findFirst({ where: { testAttemptId: attempt.id, questionId: input.questionId } });
  if (existing) {
    await prisma.testAnswer.update({
      where: { id: existing.id },
      data: { selectedIndex: input.selectedIndex, correct, timeSpentSec: input.timeSpentSec },
    });
  } else {
    await prisma.testAnswer.create({
      data: { testAttemptId: attempt.id, questionId: input.questionId, selectedIndex: input.selectedIndex, correct, timeSpentSec: input.timeSpentSec },
    });
  }
  return { ok: true };
}

export async function completeTestAttempt(attemptId: string, timeRemainingSec: number) {
  const user = await requireUser();
  const attempt = await prisma.testAttempt.findFirstOrThrow({ where: { id: attemptId, userId: user.id } });

  // Obesvarade frågor räknas som fel, precis som på riktiga provet - backfilla dem
  // innan poängen räknas ut så att nämnaren alltid är hela provets frågeantal.
  const [testQuestions, existingAnswers] = await Promise.all([
    prisma.testQuestion.findMany({ where: { testId: attempt.testId }, select: { questionId: true } }),
    prisma.testAnswer.findMany({ where: { testAttemptId: attemptId }, select: { questionId: true } }),
  ]);
  const answeredIds = new Set(existingAnswers.map((a) => a.questionId));
  const unanswered = testQuestions.filter((tq) => !answeredIds.has(tq.questionId));
  if (unanswered.length > 0) {
    await prisma.testAnswer.createMany({
      data: unanswered.map((tq) => ({ testAttemptId: attemptId, questionId: tq.questionId, selectedIndex: null, correct: false, timeSpentSec: 0 })),
    });
  }

  const answers = await prisma.testAnswer.findMany({ where: { testAttemptId: attemptId }, include: { question: true } });

  let verbalCorrect = 0;
  let verbalTotal = 0;
  let quantCorrect = 0;
  let quantTotal = 0;
  const bySubtest = new Map<string, { correct: number; total: number }>();
  const byConcept = new Map<string, { correct: number; total: number }>();

  for (const a of answers) {
    const v = isVerbal(a.question.subtest);
    if (v) {
      verbalTotal++;
      if (a.correct) verbalCorrect++;
    } else {
      quantTotal++;
      if (a.correct) quantCorrect++;
    }
    const sb = bySubtest.get(a.question.subtest) ?? { correct: 0, total: 0 };
    sb.total++;
    if (a.correct) sb.correct++;
    bySubtest.set(a.question.subtest, sb);

    const ck = conceptKey(a.question.subtest, a.question.concept);
    const cb = byConcept.get(ck) ?? { correct: 0, total: 0 };
    cb.total++;
    if (a.correct) cb.correct++;
    byConcept.set(ck, cb);

    // Uppdatera adaptiv rating precis som i vanliga sessioner
    const mastery = await prisma.conceptMastery.findUnique({
      where: { userId_subtest_concept: { userId: user.id, subtest: a.question.subtest, concept: a.question.concept } },
    });
    const priorRating = mastery?.rating ?? DEFAULT_RATING;
    const newRating = updateElo(priorRating, a.question.difficulty, a.correct);
    const intervalDays = nextReviewInterval(a.correct, 0);
    await prisma.conceptMastery.upsert({
      where: { userId_subtest_concept: { userId: user.id, subtest: a.question.subtest, concept: a.question.concept } },
      update: { rating: newRating, attempts: { increment: 1 }, correct: { increment: a.correct ? 1 : 0 }, lastSeenAt: new Date(), nextReviewAt: new Date(Date.now() + intervalDays * 86400000) },
      create: {
        userId: user.id,
        subtest: a.question.subtest,
        concept: a.question.concept,
        rating: newRating,
        attempts: 1,
        correct: a.correct ? 1 : 0,
        lastSeenAt: new Date(),
        nextReviewAt: new Date(Date.now() + intervalDays * 86400000),
      },
    });
  }

  const scoreVerbal = verbalTotal > 0 ? Math.round((verbalCorrect / verbalTotal) * 100) / 100 : 0;
  const scoreQuant = quantTotal > 0 ? Math.round((quantCorrect / quantTotal) * 100) / 100 : 0;
  const scoreTotal = Math.round((scoreVerbal + scoreQuant) * 100) / 100;

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { completedAt: new Date(), scoreVerbal, scoreQuant, scoreTotal, timeRemainingSec },
  });

  let weakestSubtest: { subtest: string; accuracy: number } | null = null;
  let strongestSubtest: { subtest: string; accuracy: number } | null = null;
  for (const [subtest, v] of bySubtest.entries()) {
    const acc = v.correct / v.total;
    if (!weakestSubtest || acc < weakestSubtest.accuracy) weakestSubtest = { subtest, accuracy: acc };
    if (!strongestSubtest || acc > strongestSubtest.accuracy) strongestSubtest = { subtest, accuracy: acc };
  }
  let weakestConcept: { subtest: string; concept: string; accuracy: number } | null = null;
  for (const [key, v] of byConcept.entries()) {
    const acc = v.correct / v.total;
    if (!weakestConcept || acc < weakestConcept.accuracy) {
      const [subtest, concept] = key.split(":");
      weakestConcept = { subtest, concept, accuracy: acc };
    }
  }

  const recommendation = await aiService.analyzeTest({
    scoreTotal,
    scoreVerbal,
    scoreQuant,
    weakestSubtest,
    strongestSubtest,
    weakestConcept,
    timeRemainingSec,
  });

  const xpResult = await awardXp(user.id, XP.TEST_COMPLETE, "test_complete");
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
  const estimate = await computeEstimate(user.id);
  await prisma.profile.update({ where: { userId: user.id }, data: { currentEstimate: estimate.total } });
  await recordPersonalRecordIfAny(user.id, estimate.total);
  const newAchievements = await checkAndUnlockAchievements(user.id, { justCompletedTestId: attempt.testId });

  return {
    scoreVerbal,
    scoreQuant,
    scoreTotal,
    weakestSubtest: weakestSubtest ? { ...weakestSubtest, label: subtestLabel(weakestSubtest.subtest) } : null,
    strongestSubtest: strongestSubtest ? { ...strongestSubtest, label: subtestLabel(strongestSubtest.subtest) } : null,
    weakestConcept,
    timeRemainingSec,
    recommendation,
    xpEarned: xpResult.xpAwarded,
    previousEstimate: profile.currentEstimate,
    newEstimate: estimate.total,
    newAchievements: newAchievements.map((a) => ({ code: a.code, name: a.name, icon: a.icon, description: a.description })),
  };
}
