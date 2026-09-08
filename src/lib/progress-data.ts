import { prisma } from "@/lib/prisma";
import { computeEstimate, computeEstimateAsOf } from "@/lib/estimate";
import { QUANT_SUBTESTS, VERBAL_SUBTESTS } from "@/lib/utils";

const ALL_SUBTESTS = [...VERBAL_SUBTESTS, ...QUANT_SUBTESTS];

export async function getProgressData(userId: string) {
  const [profile, estimate, masteries, twoWeeksAgoAttempt] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { userId } }),
    computeEstimate(userId),
    prisma.conceptMastery.findMany({ where: { userId } }),
    prisma.questionAttempt.findFirst({ where: { userId, createdAt: { lt: new Date(Date.now() - 14 * 86400000) } } }),
  ]);

  const twoWeeksAgoEstimate = twoWeeksAgoAttempt ? await computeEstimateAsOf(userId, new Date(Date.now() - 14 * 86400000)) : null;

  const bySubtest = new Map<string, { attempts: number; correct: number; concepts: { concept: string; rating: number; accuracy: number; attempts: number }[] }>();
  for (const m of masteries) {
    const bucket = bySubtest.get(m.subtest) ?? { attempts: 0, correct: 0, concepts: [] };
    bucket.attempts += m.attempts;
    bucket.correct += m.correct;
    bucket.concepts.push({ concept: m.concept, rating: m.rating, accuracy: m.attempts > 0 ? m.correct / m.attempts : 0, attempts: m.attempts });
    bySubtest.set(m.subtest, bucket);
  }

  const subtests = ALL_SUBTESTS.map((s) => {
    const bucket = bySubtest.get(s);
    const score = estimate.bySubtest[s];
    const trendBefore = twoWeeksAgoEstimate?.bySubtest[s] ?? null;
    const trend = score !== null && trendBefore !== null ? Math.round((score - trendBefore) * 100) / 100 : null;
    const weakestConcept = bucket ? [...bucket.concepts].sort((a, b) => a.rating - b.rating)[0] : null;
    return {
      subtest: s,
      isVerbal: VERBAL_SUBTESTS.includes(s),
      score,
      accuracy: bucket && bucket.attempts > 0 ? bucket.correct / bucket.attempts : null,
      attempts: bucket?.attempts ?? 0,
      trend,
      weakestConcept: weakestConcept ? { concept: weakestConcept.concept, accuracy: weakestConcept.accuracy } : null,
    };
  });

  const untrained = subtests.filter((s) => s.score === null);
  const trained = subtests.filter((s) => s.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const focusList = [...trained.slice(0, 3), ...untrained.slice(0, Math.max(0, 3 - trained.length))];

  const goalScore = profile.goalScore;
  const gapTotal = goalScore !== null ? Math.max(0, Math.round((goalScore - estimate.total) * 100) / 100) : null;

  return {
    profile,
    estimate,
    subtests,
    focusList,
    goalScore,
    gapTotal,
    hasAnyData: masteries.length > 0,
  };
}
