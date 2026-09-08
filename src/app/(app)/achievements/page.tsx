import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const user = await requireUser();
  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
  ]);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Utmärkelser</h1>
        <p className="mt-1 text-muted">
          {unlocked.length} av {all.length} upplåsta
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {all.map((a) => {
          const isUnlocked = unlockedMap.has(a.id);
          return (
            <Card key={a.id} className={cn(!isUnlocked && "opacity-50")}>
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <span className="text-3xl">{a.icon}</span>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted">{a.description}</p>
                {isUnlocked && (
                  <span className="mt-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">Upplåst</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
