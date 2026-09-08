"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

export async function updateGoal(goalScore: number | null, examDate: string | null) {
  const user = await requireUser();
  await prisma.profile.update({
    where: { userId: user.id },
    data: { goalScore, examDate: examDate ? new Date(examDate) : null },
  });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
