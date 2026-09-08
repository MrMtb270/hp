import { prisma } from "@/lib/prisma";
import { aiService } from "@/lib/ai/AIService";
import { daysUntil } from "@/lib/utils";

/**
 * Skapar högst en kontextuell "dagens påminnelse"-notis per dag och användare.
 * Anropas från dashboarden vid render - idempotent tack vare typ+datum-kollen.
 */
export async function generateDailyNudge(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const already = await prisma.notification.findFirst({
    where: { userId, type: "daily_nudge", createdAt: { gte: todayStart } },
  });
  if (already) return;

  const [profile, todayAttempts] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.questionAttempt.count({ where: { userId, createdAt: { gte: todayStart } } }),
  ]);
  if (!profile || !profile.onboardingDone) return;

  const dailyGoal = 15;
  const progressToGoalPct =
    profile.goalScore && profile.goalScore > 0 ? Math.min(100, Math.round((profile.currentEstimate / profile.goalScore) * 100)) : null;

  const text = await aiService.generateMotivation({
    name: null,
    streak: profile.streakCount,
    todayDone: todayAttempts,
    todayGoal: dailyGoal,
    weeklyDelta: null,
    daysUntilExam: daysUntil(profile.examDate),
    progressToGoalPct,
  });

  await prisma.notification.create({
    data: { userId, type: "daily_nudge", title: "Dagens påminnelse", body: text },
  });
}
