import Link from "next/link";
import { Flame, Target, TrendingUp, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/current-user";
import { getDashboardData } from "@/lib/dashboard-data";
import { generateDailyNudge } from "@/lib/notify-server";
import { aiService } from "@/lib/ai/AIService";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QuickSessionPicker } from "@/components/dashboard/quick-session-picker";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { formatScore, subtestLabel, daysUntil } from "@/lib/utils";
import { levelForXp, xpToNextLevel } from "@/lib/gamification";

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "God natt";
  if (h < 10) return "God morgon";
  if (h < 17) return "Hej";
  return "God kväll";
}

export default async function DashboardPage() {
  const { user } = await requireProfile();
  const data = await getDashboardData(user.id);
  await generateDailyNudge(user.id);
  const level = levelForXp(data.profile.xp);
  const nextLevel = xpToNextLevel(data.profile.xp);
  const days = daysUntil(data.profile.examDate);

  const motivation = await aiService.generateMotivation({
    name: user.name ?? null,
    streak: data.profile.streakCount,
    todayDone: data.todayDone,
    todayGoal: data.todayGoal,
    weeklyDelta: data.weeklyDelta,
    daysUntilExam: days,
    progressToGoalPct: data.progressToGoalPct,
  });

  const insights = await aiService.generateInsight({
    name: user.name ?? null,
    currentEstimate: data.profile.currentEstimate,
    goalScore: data.profile.goalScore,
    weeklyDelta: data.weeklyDelta,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    carelessRate: data.carelessRate,
    bestHour: data.bestHour,
    totalAttempts: data.totalAttempts,
  });

  const todayPct = Math.min(100, Math.round((data.todayDone / data.todayGoal) * 100));

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user.name ?? "där"} 👋
        </h1>
        <p className="mt-1 text-muted">{motivation}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={<Target size={16} className="text-primary" />}
          label="Prognos"
          value={formatScore(data.profile.currentEstimate)}
          sub={data.profile.goalScore ? `mål ${formatScore(data.profile.goalScore)}` : "inget mål satt"}
        />
        <StatTile
          icon={<TrendingUp size={16} className="text-success" />}
          label="Vecka"
          value={data.weeklyDelta !== null ? `${data.weeklyDelta >= 0 ? "+" : ""}${formatScore(data.weeklyDelta)}` : "–"}
          sub="förändring"
        />
        <StatTile icon={<Flame size={16} className="text-accent" />} label="Streak" value={`${data.profile.streakCount}`} sub="dagar i rad" />
        <StatTile icon={<Sparkles size={16} className="text-verbal" />} label="Nivå" value={`${level.level}`} sub={level.name} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Din bästa träning idag</h2>
              {data.recommendation.subtests.length > 0 && (
                <Badge variant="primary">{data.recommendation.subtests.map(subtestLabel).join(" + ")}</Badge>
              )}
            </div>
            <p className="mt-2 text-lg font-medium">
              {data.recommendation.subtests.length > 0
                ? `${data.recommendation.text} ger dig mest poäng per minut just nu.`
                : "Kör en diagnostisk uppvärmning så hittar vi din bästa väg framåt."}
            </p>
            <div className="mt-4">
              <QuickSessionPicker recommendedSubtests={data.recommendation.subtests} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Dagens mål</h2>
            <p className="mt-2 text-2xl font-semibold">
              {data.todayDone} / {data.todayGoal}
              <span className="ml-1 text-sm font-normal text-muted">frågor</span>
            </p>
            <Progress value={todayPct} className="mt-3" />
            {nextLevel && (
              <p className="mt-3 text-xs text-muted">
                {nextLevel.remaining} XP till {nextLevel.next.name}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Utveckling senaste 6 veckorna</h2>
              {data.profile.goalScore && <span className="text-xs text-muted">{data.progressToGoalPct}% mot målet</span>}
            </div>
            <div className="mt-2">
              <ProgressChart points={data.historyPoints} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">AI-insikter</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {insights.length === 0 && <li className="text-sm text-muted">Träna några pass så börjar insikterna dyka upp här.</li>}
              {insights.map((text, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Svagaste område</h2>
            {data.weaknesses.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Ingen data än - kör en session för att se dina mönster.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {data.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-surface-2 px-3 py-2 text-sm">
                    <span>
                      {subtestLabel(w.subtest)} · {w.concept}
                    </span>
                    <span className="text-muted">{Math.round(w.accuracy * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Nästa milstolpe</h2>
              <Trophy size={16} className="text-accent" />
            </div>
            {data.profile.goalScore ? (
              <>
                <p className="mt-2 text-sm">
                  Du behöver <strong>+{formatScore(Math.max(data.profile.goalScore - data.profile.currentEstimate, 0))}</strong> för att nå{" "}
                  {formatScore(data.profile.goalScore)}.
                </p>
                <Progress value={data.progressToGoalPct ?? 0} className="mt-3" colorClassName="bg-accent" />
                <p className="mt-2 text-xs text-muted">Du är {data.progressToGoalPct}% av vägen dit.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Sätt ett målresultat i din{" "}
                <Link href="/profile" className="text-primary hover:underline">
                  profil
                </Link>{" "}
                för att se din väg dit.
              </p>
            )}
            {days !== null && <p className="mt-3 text-xs text-muted">{days > 0 ? `${days} dagar kvar till provet` : "Provdatum har passerat"}</p>}
          </CardContent>
        </Card>
      </div>

      <Link
        href="/test"
        className="group flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface p-5 transition-colors hover:border-primary"
      >
        <div>
          <h3 className="font-medium">Redo för ett fullt övningsprov?</h3>
          <p className="mt-1 text-sm text-muted">Realistisk provmiljö med tidtagning och fullständig analys efteråt.</p>
        </div>
        <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          {icon}
          {label}
        </div>
        <p className="mt-1.5 text-xl font-semibold">{value}</p>
        <p className="text-xs text-muted">{sub}</p>
      </CardContent>
    </Card>
  );
}
