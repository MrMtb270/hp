"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { generateWeeklyPlan } from "@/lib/studyPlan";
import { estimateSubscore } from "@/lib/adaptive";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = måndag
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getOrCreatePlan(dailyMinutes = 20) {
  const user = await requireUser();
  const weekStart = startOfWeek(new Date());

  const existing = await prisma.studyPlan.findFirst({
    where: { userId: user.id, weekStart },
    include: { items: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (existing) return existing;

  const masteries = await prisma.conceptMastery.findMany({ where: { userId: user.id } });
  const bySubtest = new Map<string, number[]>();
  for (const m of masteries) {
    const arr = bySubtest.get(m.subtest) ?? [];
    arr.push(estimateSubscore(m.rating));
    bySubtest.set(m.subtest, arr);
  }
  const weaknesses = Array.from(bySubtest.entries()).map(([subtest, arr]) => ({
    subtest,
    rating: arr.reduce((a, b) => a + b, 0) / arr.length,
  }));
  if (weaknesses.length === 0) {
    for (const s of ["ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"]) weaknesses.push({ subtest: s, rating: 0.5 });
  }

  const days = generateWeeklyPlan(weaknesses, dailyMinutes);
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      weekStart,
      items: { create: days.map((d) => ({ dayOfWeek: d.dayOfWeek, subtest: d.subtest as never, label: d.label, minutes: d.minutes })) },
    },
    include: { items: { orderBy: { dayOfWeek: "asc" } } },
  });
  return plan;
}

export async function adjustTodayMinutes(planId: string, minutes: number) {
  const user = await requireUser();
  const plan = await prisma.studyPlan.findFirstOrThrow({ where: { id: planId, userId: user.id } });
  const todayIdx = (new Date().getDay() + 6) % 7;
  const item = await prisma.studyPlanItem.findFirst({ where: { studyPlanId: plan.id, dayOfWeek: todayIdx } });
  if (item) {
    await prisma.studyPlanItem.update({ where: { id: item.id }, data: { minutes } });
  }
  return { ok: true };
}

export async function markPlanItemDone(itemId: string) {
  const user = await requireUser();
  const item = await prisma.studyPlanItem.findFirstOrThrow({
    where: { id: itemId, studyPlan: { userId: user.id } },
  });
  await prisma.studyPlanItem.update({ where: { id: item.id }, data: { done: true } });
  return { ok: true };
}
