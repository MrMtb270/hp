"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return { notifications, unreadCount };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  return { ok: true };
}
