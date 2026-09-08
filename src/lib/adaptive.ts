// Adaptivt urval av frågor - ett enkelt Elo-baserat system.
// Arkitekturen är medvetet utbytbar: `pickNextQuestions` och `updateRatingsAfterAttempt`
// kan senare ersättas med Bayesian Knowledge Tracing eller IRT utan att resten
// av appen behöver ändras.

export const DEFAULT_RATING = 1000;
const K_FACTOR = 32;
const SWEET_SPOT = 0.68; // P(rätt) vi siktar mot - tillräckligt utmanande, inte hopplöst

export function expectedScore(userRating: number, itemRating: number) {
  return 1 / (1 + Math.pow(10, (itemRating - userRating) / 400));
}

export function updateElo(userRating: number, itemRating: number, correct: boolean) {
  const expected = expectedScore(userRating, itemRating);
  const actual = correct ? 1 : 0;
  return userRating + K_FACTOR * (actual - expected);
}

export type CandidateQuestion = {
  id: string;
  subtest: string;
  concept: string;
  difficulty: number;
};

export type ConceptRatingMap = Record<string, number>; // key: `${subtest}:${concept}`

export function conceptKey(subtest: string, concept: string) {
  return `${subtest}:${concept}`;
}

/**
 * Rankar kandidatfrågor efter hur nära de ligger användarens "sweet spot" (~68% chans att klara den),
 * med ett bonus-viktat inslag av slump så att träningen inte känns repetitiv, plus en boost
 * för koncept som är redo för spaced-repetition-återbesök.
 */
export function pickNextQuestions(
  candidates: CandidateQuestion[],
  userRatings: ConceptRatingMap,
  dueConceptKeys: Set<string>,
  count: number,
  excludeIds: Set<string> = new Set()
): CandidateQuestion[] {
  const pool = candidates.filter((c) => !excludeIds.has(c.id));
  const scored = pool.map((c) => {
    const key = conceptKey(c.subtest, c.concept);
    const rating = userRatings[key] ?? DEFAULT_RATING;
    const pCorrect = expectedScore(rating, c.difficulty);
    const distance = Math.abs(pCorrect - SWEET_SPOT);
    const dueBoost = dueConceptKeys.has(key) ? 0.35 : 0;
    const noise = Math.random() * 0.12;
    const score = 1 - distance + dueBoost + noise;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.c);
}

export function estimateSubscore(rating: number) {
  // Mappar Elo-rating till HP-delpoäng 0.00-1.00. Kalibrerad mot frågebankens
  // svårighetsspann (~700-1300): DEFAULT_RATING (1000) motsvarar en mittenpoäng
  // på 0.50, så en session med tydliga framsteg syns direkt i prognosen.
  const norm = clampNumber((rating - 700) / 600, 0, 1);
  return norm;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function nextReviewInterval(correct: boolean, previousIntervalDays: number) {
  if (!correct) return 0.5; // samma dag / några timmar senare
  if (previousIntervalDays <= 0) return 1;
  const next = previousIntervalDays * 2.1;
  return Math.min(next, 30);
}
