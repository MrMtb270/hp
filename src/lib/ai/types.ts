export interface AIProvider {
  readonly name: string;
  complete(input: { system: string; prompt: string; maxTokens?: number }): Promise<string>;
}

export type HintLevel = 1 | 2 | 3 | 4;

export type ExplanationStyle = "short" | "steps" | "eli5" | "similar" | "hint";

export interface ExplainRequest {
  questionStem: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  explanationShort: string;
  explanationSteps: string[];
  subtest: string;
  concept: string;
  style: ExplanationStyle;
}

export interface HintRequest {
  questionStem: string;
  concept: string;
  subtest: string;
  hints: (string | null | undefined)[];
  level: HintLevel;
}

export interface InsightInput {
  name: string | null;
  currentEstimate: number;
  goalScore: number | null;
  weeklyDelta: number | null;
  strengths: { subtest: string; concept: string; rating: number }[];
  weaknesses: { subtest: string; concept: string; rating: number }[];
  carelessRate: number | null;
  bestHour: number | null;
  totalAttempts: number;
}

export interface MotivationInput {
  name: string | null;
  streak: number;
  todayDone: number;
  todayGoal: number;
  weeklyDelta: number | null;
  daysUntilExam: number | null;
  progressToGoalPct: number | null;
}

export interface TestAnalysisInput {
  scoreTotal: number;
  scoreVerbal: number;
  scoreQuant: number;
  weakestSubtest: { subtest: string; accuracy: number } | null;
  strongestSubtest: { subtest: string; accuracy: number } | null;
  weakestConcept: { subtest: string; concept: string; accuracy: number } | null;
  timeRemainingSec: number | null;
}
