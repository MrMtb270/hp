import { prisma } from "@/lib/prisma";
import { levelForXp, updateStreak, XP } from "@/lib/gamification";

export async function awardXp(userId: string, amount: number, reason: string) {
  if (amount === 0) return { xpAwarded: 0, leveledUp: false, newLevel: null as number | null };
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  const newXp = profile.xp + amount;
  const oldLevel = levelForXp(profile.xp).level;
  const newLevelInfo = levelForXp(newXp);
  await prisma.profile.update({ where: { userId }, data: { xp: newXp, level: newLevelInfo.level } });
  await prisma.xPEvent.create({ data: { userId, amount, reason } });
  return { xpAwarded: amount, leveledUp: newLevelInfo.level > oldLevel, newLevel: newLevelInfo.level > oldLevel ? newLevelInfo.level : null };
}

export async function touchDailyStreak(userId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  const result = updateStreak(
    { streakCount: profile.streakCount, streakLastActive: profile.streakLastActive, streakFreezes: profile.streakFreezes },
    new Date()
  );
  if (result.xpAwarded === 0 && result.streakCount === profile.streakCount) {
    return { streakCount: profile.streakCount, changed: false, usedFreeze: false };
  }
  await prisma.profile.update({
    where: { userId },
    data: { streakCount: result.streakCount, streakLastActive: result.streakLastActive, streakFreezes: result.streakFreezes },
  });
  if (result.xpAwarded > 0) {
    await prisma.xPEvent.create({ data: { userId, amount: result.xpAwarded, reason: "streak" } });
    await prisma.profile.update({ where: { userId }, data: { xp: { increment: result.xpAwarded } } });
  }
  return { streakCount: result.streakCount, changed: true, usedFreeze: result.usedFreeze };
}

export async function checkAndUnlockAchievements(userId: string, context: { justCompletedSessionId?: string; justCompletedTestId?: string } = {}) {
  const [profile, totalAttempts, unlocked, distinctSubtests] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { userId } }),
    prisma.questionAttempt.count({ where: { userId } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { code: true } } } }),
    prisma.questionAttempt.findMany({ where: { userId }, select: { question: { select: { subtest: true } } }, distinct: ["questionId"] }),
  ]);
  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code));
  const toUnlock = new Set<string>();

  if (context.justCompletedSessionId && !unlockedCodes.has("first_session")) toUnlock.add("first_session");
  if (context.justCompletedTestId && !unlockedCodes.has("first_test")) toUnlock.add("first_test");
  if (totalAttempts >= 100 && !unlockedCodes.has("questions_100")) toUnlock.add("questions_100");
  if (totalAttempts >= 1000 && !unlockedCodes.has("questions_1000")) toUnlock.add("questions_1000");
  if (profile.streakCount >= 7 && !unlockedCodes.has("streak_7")) toUnlock.add("streak_7");
  if (profile.streakCount >= 30 && !unlockedCodes.has("streak_30")) toUnlock.add("streak_30");

  const subtestsSeen = new Set(distinctSubtests.map((d) => d.question.subtest));
  if (subtestsSeen.size >= 8 && !unlockedCodes.has("all_rounder")) toUnlock.add("all_rounder");

  const hour = new Date().getHours();
  if (hour >= 22 && !unlockedCodes.has("night_owl")) toUnlock.add("night_owl");
  if (hour < 7 && !unlockedCodes.has("early_bird")) toUnlock.add("early_bird");

  if (context.justCompletedSessionId) {
    const attempts = await prisma.questionAttempt.findMany({ where: { sessionId: context.justCompletedSessionId } });
    if (attempts.length >= 4 && attempts.every((a) => a.correct) && !unlockedCodes.has("perfect_section")) {
      toUnlock.add("perfect_section");
    }
  }

  if (toUnlock.size === 0) return [];

  const achievements = await prisma.achievement.findMany({ where: { code: { in: Array.from(toUnlock) } } });
  const newly = [];
  for (const a of achievements) {
    await prisma.userAchievement.create({ data: { userId, achievementId: a.id } }).catch(() => null);
    await prisma.notification.create({
      data: { userId, type: "achievement", title: `${a.icon} ${a.name}`, body: a.description },
    });
    newly.push(a);
  }
  return newly;
}

export async function recordPersonalRecordIfAny(userId: string, newEstimate: number) {
  const events = await prisma.xPEvent.findMany({ where: { userId, reason: "personal_record" } });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  const wasFirst = events.length === 0;
  if (newEstimate > profile.currentEstimate + 0.001) {
    await awardXp(userId, XP.PERSONAL_RECORD, "personal_record");
    if (wasFirst) {
      const ach = await prisma.achievement.findUnique({ where: { code: "first_pr" } });
      if (ach) await prisma.userAchievement.create({ data: { userId, achievementId: ach.id } }).catch(() => null);
    }
    return true;
  }
  return false;
}
