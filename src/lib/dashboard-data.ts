import { prisma } from "@/lib/prisma";
import { computeEstimateAsOf } from "@/lib/estimate";
import { subtestLabel } from "@/lib/utils";

const DAILY_GOAL = 15;

export async function getDashboardData(userId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayAttempts, masteries, recentAttempts, weekAgoAttemptExists] = await Promise.all([
    prisma.questionAttempt.count({ where: { userId, createdAt: { gte: todayStart } } }),
    prisma.conceptMastery.findMany({ where: { userId } }),
    prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { question: { select: { subtest: true, concept: true } } },
    }),
    prisma.questionAttempt.findFirst({ where: { userId, createdAt: { lt: new Date(Date.now() - 7 * 86400000) } } }),
  ]);

  const weekAgoEstimate = weekAgoAttemptExists
    ? await computeEstimateAsOf(userId, new Date(Date.now() - 7 * 86400000))
    : null;
  const weeklyDelta = weekAgoEstimate ? Math.round((profile.currentEstimate - weekAgoEstimate.total) * 100) / 100 : null;

  // Kräv minst två försök för att räknas som styrka/svaghet - annars kan en enda gissning
  // dominera listan och ge missvisande "svaghet med 100% träffsäkerhet".
  const reliable = masteries.filter((m) => m.attempts >= 2);
  const sorted = [...(reliable.length > 0 ? reliable : masteries)].sort((a, b) => a.rating - b.rating);
  const weaknesses = sorted.slice(0, 3).map((m) => ({ subtest: m.subtest, concept: m.concept, rating: m.rating, accuracy: m.attempts > 0 ? m.correct / m.attempts : 0 }));
  const strengths = sorted
    .slice(-3)
    .reverse()
    .map((m) => ({ subtest: m.subtest, concept: m.concept, rating: m.rating, accuracy: m.attempts > 0 ? m.correct / m.attempts : 0 }));

  const errorReasons = recentAttempts.filter((a) => !a.correct && a.errorReason);
  const carelessCount = errorReasons.filter((a) => a.errorReason === "CARELESS").length;
  const carelessRate = errorReasons.length > 0 ? carelessCount / errorReasons.length : null;

  const hourCounts = new Map<number, { correct: number; total: number }>();
  for (const a of recentAttempts) {
    const h = a.createdAt.getHours();
    const bucket = hourCounts.get(h) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (a.correct) bucket.correct += 1;
    hourCounts.set(h, bucket);
  }
  let bestHour: number | null = null;
  let bestRate = -1;
  for (const [h, v] of hourCounts.entries()) {
    if (v.total < 3) continue;
    const rate = v.correct / v.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestHour = h;
    }
  }

  // Progresshistorik: 6 punkter, en per vecka bakåt
  const historyPoints: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(Date.now() - i * 7 * 86400000);
    const est = i === 0 ? { total: profile.currentEstimate } : await computeEstimateAsOf(userId, date);
    historyPoints.push({ label: i === 0 ? "Nu" : `-${i}v`, value: est.total });
  }

  const recommendation = buildRecommendation(weaknesses);

  const progressToGoalPct =
    profile.goalScore && profile.goalScore > 0 ? Math.min(100, Math.round((profile.currentEstimate / profile.goalScore) * 100)) : null;

  return {
    profile,
    todayDone: todayAttempts,
    todayGoal: DAILY_GOAL,
    weeklyDelta,
    weaknesses,
    strengths,
    carelessRate,
    bestHour,
    totalAttempts: recentAttempts.length,
    historyPoints,
    recommendation,
    progressToGoalPct,
  };
}

function buildRecommendation(weaknesses: { subtest: string; concept: string }[]) {
  if (weaknesses.length === 0) return { text: "Blandad uppvärmning - 15 min", subtests: [] as string[] };
  const uniqueSubtests = Array.from(new Set(weaknesses.map((w) => w.subtest))).slice(0, 2);
  const parts = uniqueSubtests.map((s) => subtestLabel(s));
  return { text: `${parts.join(" + ")}`, subtests: uniqueSubtests };
}
