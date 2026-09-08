import { prisma } from "@/lib/prisma";
import { DEFAULT_RATING, estimateSubscore, updateElo } from "@/lib/adaptive";
import { QUANT_SUBTESTS, VERBAL_SUBTESTS } from "@/lib/utils";

export async function computeEstimate(userId: string) {
  const masteries = await prisma.conceptMastery.findMany({ where: { userId } });
  if (masteries.length === 0) return { total: 0.8, verbal: 0.4, quant: 0.4 };

  const bySubtest = new Map<string, number[]>();
  for (const m of masteries) {
    const arr = bySubtest.get(m.subtest) ?? [];
    arr.push(estimateSubscore(m.rating));
    bySubtest.set(m.subtest, arr);
  }

  const avgFor = (subtests: string[]) => {
    const scores = subtests.map((s) => {
      const arr = bySubtest.get(s);
      if (!arr || arr.length === 0) return 0.4; // neutral baseline för ej tränade delprov
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const verbal = avgFor(VERBAL_SUBTESTS);
  const quant = avgFor(QUANT_SUBTESTS);
  const total = Math.round((verbal + quant) * 100) / 100;

  return { total, verbal: Math.round(verbal * 100) / 100, quant: Math.round(quant * 100) / 100 };
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
  if (attempts.length === 0) return { total: 0.8, verbal: 0.4, quant: 0.4 };

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

  const avgFor = (subtests: string[]) => {
    const scores = subtests.map((s) => {
      const arr = bySubtest.get(s);
      if (!arr || arr.length === 0) return 0.4;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const verbal = avgFor(VERBAL_SUBTESTS);
  const quant = avgFor(QUANT_SUBTESTS);
  return { total: Math.round((verbal + quant) * 100) / 100, verbal: Math.round(verbal * 100) / 100, quant: Math.round(quant * 100) / 100 };
}
