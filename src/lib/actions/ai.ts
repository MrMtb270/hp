"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { aiService } from "@/lib/ai/AIService";
import { ExplanationStyle, HintLevel } from "@/lib/ai/types";

export async function requestExplanation(input: { questionId: string; selectedIndex: number | null; style: ExplanationStyle }) {
  await requireUser();
  const q = await prisma.question.findUniqueOrThrow({ where: { id: input.questionId } });
  const text = await aiService.generateExplanation({
    questionStem: q.stem,
    options: JSON.parse(q.options),
    correctIndex: q.correctIndex,
    selectedIndex: input.selectedIndex,
    explanationShort: q.explanationShort,
    explanationSteps: JSON.parse(q.explanationSteps),
    subtest: q.subtest,
    concept: q.concept,
    style: input.style,
  });
  return { text };
}

export async function requestHint(input: { questionId: string; level: HintLevel }) {
  await requireUser();
  const q = await prisma.question.findUniqueOrThrow({ where: { id: input.questionId } });
  const text = await aiService.generateHint({
    questionStem: q.stem,
    concept: q.concept,
    subtest: q.subtest,
    hints: [q.hint1, q.hint2, q.hint3],
    level: input.level,
  });
  return { text };
}
