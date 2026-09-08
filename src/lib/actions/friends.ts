"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";
import { levelForXp } from "@/lib/gamification";

export async function getFriendsData() {
  const user = await requireUser();

  const [outgoing, incoming] = await Promise.all([
    prisma.friendship.findMany({
      where: { userId: user.id },
      include: { friend: { include: { profile: true } } },
    }),
    prisma.friendship.findMany({
      where: { friendId: user.id },
      include: { user: { include: { profile: true } } },
    }),
  ]);

  const accepted = [
    ...outgoing.filter((f) => f.status === "accepted").map((f) => ({ friendshipId: f.id, ...f.friend })),
    ...incoming.filter((f) => f.status === "accepted").map((f) => ({ friendshipId: f.id, ...f.user })),
  ];
  const pendingIncoming = incoming.filter((f) => f.status === "pending").map((f) => ({ friendshipId: f.id, ...f.user }));
  const pendingOutgoing = outgoing.filter((f) => f.status === "pending").map((f) => ({ friendshipId: f.id, ...f.friend }));

  return {
    friends: accepted.map((f) => ({
      friendshipId: f.friendshipId,
      id: f.id,
      name: f.name,
      email: f.email,
      level: f.profile ? levelForXp(f.profile.xp) : null,
      xp: f.profile?.xp ?? 0,
      streakCount: f.profile?.streakCount ?? 0,
      currentEstimate: f.profile?.currentEstimate ?? null,
    })),
    pendingIncoming: pendingIncoming.map((f) => ({ friendshipId: f.friendshipId, id: f.id, name: f.name, email: f.email })),
    pendingOutgoing: pendingOutgoing.map((f) => ({ friendshipId: f.friendshipId, id: f.id, name: f.name, email: f.email })),
  };
}

export async function sendFriendRequest(email: string) {
  const user = await requireUser();
  const normalized = email.trim().toLowerCase();

  if (normalized === user.email?.toLowerCase()) {
    return { error: "Du kan inte lägga till dig själv." };
  }

  const target = await prisma.user.findUnique({ where: { email: normalized } });
  if (!target) {
    return { error: "Ingen användare med den e-postadressen hittades." };
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: user.id, friendId: target.id },
        { userId: target.id, friendId: user.id },
      ],
    },
  });
  if (existing) {
    return { error: existing.status === "accepted" ? "Ni är redan vänner." : "En förfrågan finns redan." };
  }

  await prisma.friendship.create({ data: { userId: user.id, friendId: target.id, status: "pending" } });
  revalidatePath("/friends");
  return { ok: true };
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const user = await requireUser();
  const friendship = await prisma.friendship.findFirstOrThrow({ where: { id: friendshipId, friendId: user.id } });

  if (accept) {
    await prisma.friendship.update({ where: { id: friendship.id }, data: { status: "accepted" } });
  } else {
    await prisma.friendship.delete({ where: { id: friendship.id } });
  }
  revalidatePath("/friends");
  return { ok: true };
}

export async function removeFriendship(friendshipId: string) {
  const user = await requireUser();
  await prisma.friendship.deleteMany({
    where: { id: friendshipId, OR: [{ userId: user.id }, { friendId: user.id }] },
  });
  revalidatePath("/friends");
  return { ok: true };
}

export async function getLeaderboard() {
  const user = await requireUser();
  const data = await getFriendsData();
  const ids = [user.id, ...data.friends.map((f) => f.id)];
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [profiles, weeklyXp] = await Promise.all([
    prisma.profile.findMany({ where: { userId: { in: ids } }, include: { user: true } }),
    prisma.xPEvent.groupBy({ by: ["userId"], where: { userId: { in: ids }, createdAt: { gte: weekAgo } }, _sum: { amount: true } }),
  ]);

  const weeklyMap = new Map(weeklyXp.map((w) => [w.userId, w._sum.amount ?? 0]));

  const rows = profiles.map((p) => ({
    userId: p.userId,
    name: p.user.name ?? p.user.email,
    isMe: p.userId === user.id,
    totalXp: p.xp,
    weeklyXp: weeklyMap.get(p.userId) ?? 0,
    streakCount: p.streakCount,
    level: levelForXp(p.xp),
  }));

  rows.sort((a, b) => b.weeklyXp - a.weeklyXp);
  return rows;
}
