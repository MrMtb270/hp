"use server";

import { prisma } from "@/lib/prisma";

export async function getDemoQuestions() {
  const all = await prisma.question.findMany({ where: { isDemo: true } });
  const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled.map((q) => ({
    id: q.id,
    subtest: q.subtest,
    concept: q.concept,
    stem: q.stem,
    options: JSON.parse(q.options) as string[],
  }));
}

export async function checkDemoAnswer(questionId: string, selectedIndex: number) {
  const q = await prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  return { correct: selectedIndex === q.correctIndex, correctIndex: q.correctIndex, explanationShort: q.explanationShort };
}
