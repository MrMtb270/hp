import { prisma } from "@/lib/prisma";
import { DEFAULT_RATING, estimateSubscore, updateElo } from "@/lib/adaptive";
import { QUANT_SUBTESTS, VERBAL_SUBTESTS } from "@/lib/utils";

const ALL_SUBTESTS = [...VERBAL_SUBTESTS, ...QUANT_SUBTESTS];

export type SubtestBreakdown = Record<string, number | null>; // null = inget koncept tränat än

function summarize(bySubtest: Map<string, number[]>) {
  const breakdown: SubtestBreakdown = {};
  for (const s of ALL_SUBTESTS) {
    const arr = bySubtest.get(s);
    breakdown[s] = arr && arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;
  }

  // Otränade delprov räknas som 0 i totalen - en profil ska starta på noll, inte på en påhittad baseline.
  const avgFor = (subtests: string[]) => {
    const scores = subtests.map((s) => breakdown[s] ?? 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const verbal = Math.round(avgFor(VERBAL_SUBTESTS) * 100) / 100;
  const quant = Math.round(avgFor(QUANT_SUBTESTS) * 100) / 100;
  const total = Math.round((verbal + quant) * 100) / 100;

  return { total, verbal, quant, bySubtest: breakdown };
}

export async function computeEstimate(userId: string) {
  const masteries = await prisma.conceptMastery.findMany({ where: { userId } });
  if (masteries.length === 0) return { total: 0, verbal: 0, quant: 0, bySubtest: Object.fromEntries(ALL_SUBTESTS.map((s) => [s, null])) as SubtestBreakdown };

  const bySubtest = new Map<string, number[]>();
  for (const m of masteries) {
    const arr = bySubtest.get(m.subtest) ?? [];
    arr.push(estimateSubscore(m.rating));
    bySubtest.set(m.subtest, arr);
  }

  return summarize(bySubtest);
}

/**
 * Räknar om koncept-ratings genom att spela upp alla svar fram till (och med) `cutoff`.
 * Används för att härleda historiska prognospunkter utan att behöva en separat historiktabell.
 */
export async function computeEstimateAsOf(userId: string, cutoff: Date) {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId, createdAt: { lte: cutoff } },
    include: { question: { select: { subtest: true, concept: true, difficulty: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (attempts.length === 0) return { total: 0, verbal: 0, quant: 0, bySubtest: Object.fromEntries(ALL_SUBTESTS.map((s) => [s, null])) as SubtestBreakdown };

  const ratings = new Map<string, number>();
  for (const a of attempts) {
    const key = `${a.question.subtest}:${a.question.concept}`;
    const prior = ratings.get(key) ?? DEFAULT_RATING;
    ratings.set(key, updateElo(prior, a.question.difficulty, a.correct));
  }

  const bySubtest = new Map<string, number[]>();
  for (const [key, rating] of ratings.entries()) {
    const subtest = key.split(":")[0];
    const arr = bySubtest.get(subtest) ?? [];
    arr.push(estimateSubscore(rating));
    bySubtest.set(subtest, arr);
  }

  return summarize(bySubtest);
}
