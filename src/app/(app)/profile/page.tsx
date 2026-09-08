import Link from "next/link";
import { Trophy, Users, ChevronRight, CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard-data";
import { Card, CardContent } from "@/components/ui/card";
import { GoalEditor } from "@/components/profile/goal-editor";
import { formatMinutes, formatScore, subtestLabel } from "@/lib/utils";
import { levelForXp } from "@/lib/gamification";

export default async function ProfilePage() {
  const { user } = await requireProfile();
  const data = await getDashboardData(user.id);
  const level = levelForXp(data.profile.xp);

  const sessions = await prisma.studySession.findMany({ where: { userId: user.id, completedAt: { not: null } } });
  const avgSessionMin = sessions.length > 0 ? Math.round(data.profile.totalStudySeconds / 60 / sessions.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Din profil</h1>
        <p className="mt-1 text-muted">
          {user.name} · Nivå {level.level} ({level.name})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:hidden">
        <Link href="/plan">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays size={16} className="text-success" /> Studieplan
              </span>
              <ChevronRight size={16} className="text-muted" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/achievements">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Trophy size={16} className="text-accent" /> Utmärkelser
              </span>
              <ChevronRight size={16} className="text-muted" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/friends">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users size={16} className="text-primary" /> Vänner
              </span>
              <ChevronRight size={16} className="text-muted" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-medium text-muted">Mål</h2>
          <div className="mt-3">
            <GoalEditor
              initialGoal={data.profile.goalScore}
              initialDate={data.profile.examDate ? data.profile.examDate.toISOString().slice(0, 10) : null}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Mina styrkor</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {data.strengths.length === 0 && <li className="text-sm text-muted">Träna mer för att se dina styrkor.</li>}
              {data.strengths.map((s, i) => (
                <li key={i} className="flex justify-between rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
                  <span>
                    {subtestLabel(s.subtest)} · {s.concept}
                  </span>
                  <span>{Math.round(s.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Mina svagheter</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {data.weaknesses.length === 0 && <li className="text-sm text-muted">Träna mer för att se dina svagheter.</li>}
              {data.weaknesses.map((s, i) => (
                <li key={i} className="flex justify-between rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
                  <span>
                    {subtestLabel(s.subtest)} · {s.concept}
                  </span>
                  <span>{Math.round(s.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Studiestil" value={data.profile.studyStyle ?? "Utforskas..."} />
        <MiniStat label="Snitt/session" value={avgSessionMin > 0 ? formatMinutes(avgSessionMin) : "–"} />
        <MiniStat label="Bästa studietid" value={data.bestHour !== null ? `${data.bestHour}:00–${data.bestHour + 1}:00` : "Okänt än"} />
        <MiniStat label="Total träning" value={formatMinutes(Math.round(data.profile.totalStudySeconds / 60))} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-medium text-muted">Din väg hittills</h2>
          <p className="mt-2 text-sm">
            Startade på ungefär <strong>{formatScore(0.8)}</strong>, ligger nu på <strong>{formatScore(data.profile.currentEstimate)}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
