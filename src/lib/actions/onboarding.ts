"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export type OnboardingData = {
  goalScore: number | null;
  examDate: string | null;
  previousAttempts: "NONE" | "ONCE" | "MULTIPLE";
  previousScore: number | null;
  selfAssessment: Record<string, number>;
};

export async function saveOnboardingStep1to4(data: OnboardingData) {
  const user = await requireUser();
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      goalScore: data.goalScore,
      examDate: data.examDate ? new Date(data.examDate) : null,
      previousAttempts: data.previousAttempts,
      previousScore: data.previousScore,
      selfAssessment: JSON.stringify(data.selfAssessment),
    },
    create: {
      userId: user.id,
      goalScore: data.goalScore,
      examDate: data.examDate ? new Date(data.examDate) : null,
      previousAttempts: data.previousAttempts,
      previousScore: data.previousScore,
      selfAssessment: JSON.stringify(data.selfAssessment),
    },
  });
  return { ok: true };
}

export async function completeOnboarding() {
  const user = await requireUser();
  await prisma.profile.update({ where: { userId: user.id }, data: { onboardingDone: true } });
  redirect("/dashboard");
}

export async function skipOnboarding() {
  const user = await requireUser();
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { onboardingDone: true },
    create: { userId: user.id, onboardingDone: true },
  });
  redirect("/dashboard");
}
