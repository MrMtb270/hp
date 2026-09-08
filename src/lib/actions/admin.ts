"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Subtest } from "@prisma/client";

export type QuestionInput = {
  subtest: Subtest;
  concept: string;
  difficulty: number;
  stem: string;
  options: string[];
  correctIndex: number;
  explanationShort: string;
  explanationSteps: string[];
  hint1?: string;
  hint2?: string;
  hint3?: string;
};

export async function createQuestion(input: QuestionInput) {
  await requireAdmin();
  await prisma.question.create({
    data: {
      subtest: input.subtest,
      concept: input.concept,
      difficulty: input.difficulty,
      stem: input.stem,
      options: JSON.stringify(input.options),
      correctIndex: input.correctIndex,
      explanationShort: input.explanationShort,
      explanationSteps: JSON.stringify(input.explanationSteps),
      hint1: input.hint1 || null,
      hint2: input.hint2 || null,
      hint3: input.hint3 || null,
      isDemo: false,
    },
  });
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function updateQuestion(id: string, input: QuestionInput) {
  await requireAdmin();
  await prisma.question.update({
    where: { id },
    data: {
      subtest: input.subtest,
      concept: input.concept,
      difficulty: input.difficulty,
      stem: input.stem,
      options: JSON.stringify(input.options),
      correctIndex: input.correctIndex,
      explanationShort: input.explanationShort,
      explanationSteps: JSON.stringify(input.explanationSteps),
      hint1: input.hint1 || null,
      hint2: input.hint2 || null,
      hint3: input.hint3 || null,
    },
  });
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  await prisma.questionAttempt.deleteMany({ where: { questionId: id } });
  await prisma.testQuestion.deleteMany({ where: { questionId: id } });
  await prisma.question.delete({ where: { id } });
  revalidatePath("/admin/questions");
}
