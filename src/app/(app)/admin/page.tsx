import Link from "next/link";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { subtestLabel } from "@/lib/utils";

export default async function AdminPage() {
  await requireAdmin();

  const [userCount, questionCount, attemptCount, sessionCount, tooEasy, tooHard, byUser] = await Promise.all([
    prisma.user.count(),
    prisma.question.count(),
    prisma.questionAttempt.count(),
    prisma.studySession.count(),
    prisma.question.findMany({ where: { timesAnswered: { gte: 5 } }, orderBy: { timesCorrect: "desc" }, take: 200 }),
    prisma.question.findMany({ where: { timesAnswered: { gte: 5 } }, orderBy: { timesCorrect: "asc" }, take: 200 }),
    prisma.user.findMany({
      include: { profile: true, _count: { select: { attempts: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const easiest = tooEasy.filter((q) => q.timesCorrect / q.timesAnswered > 0.9).slice(0, 5);
  const hardest = tooHard.filter((q) => q.timesCorrect / q.timesAnswered < 0.2).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted">Översikt över plattformens innehåll och användning.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Användare" value={userCount} />
        <Stat label="Frågor" value={questionCount} />
        <Stat label="Besvarade frågor" value={attemptCount} />
        <Stat label="Sessioner" value={sessionCount} />
      </div>

      <div className="flex gap-3">
        <Link href="/admin/questions" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Hantera frågor
        </Link>
        <Link href="/admin/questions/new" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
          + Ny fråga
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Möjligen för lätta frågor (&gt;90% rätt)</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {easiest.length === 0 && <li className="text-muted">Inga ännu.</li>}
              {easiest.map((q) => (
                <li key={q.id} className="flex justify-between">
                  <Link href={`/admin/questions/${q.id}/edit`} className="truncate hover:text-primary">
                    {subtestLabel(q.subtest)}: {q.stem.slice(0, 40)}...
                  </Link>
                  <span className="text-muted">{Math.round((q.timesCorrect / q.timesAnswered) * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Möjligen för svåra frågor (&lt;20% rätt)</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {hardest.length === 0 && <li className="text-muted">Inga ännu.</li>}
              {hardest.map((q) => (
                <li key={q.id} className="flex justify-between">
                  <Link href={`/admin/questions/${q.id}/edit`} className="truncate hover:text-primary">
                    {subtestLabel(q.subtest)}: {q.stem.slice(0, 40)}...
                  </Link>
                  <span className="text-muted">{Math.round((q.timesCorrect / q.timesAnswered) * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-medium text-muted">Senaste användare</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-2">Namn</th>
                  <th className="pb-2">Prognos</th>
                  <th className="pb-2">Streak</th>
                  <th className="pb-2">Besvarade</th>
                </tr>
              </thead>
              <tbody>
                {byUser.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="py-2">{u.name ?? u.email}</td>
                    <td className="py-2">{u.profile?.currentEstimate.toFixed(2) ?? "–"}</td>
                    <td className="py-2">{u.profile?.streakCount ?? 0}</td>
                    <td className="py-2">{u._count.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
