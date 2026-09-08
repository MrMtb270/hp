import Link from "next/link";
import { ArrowUp, ArrowDown, Target, TrendingUp } from "lucide-react";
import { requireProfile } from "@/lib/current-user";
import { getProgressData } from "@/lib/progress-data";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatScore, subtestLabel } from "@/lib/utils";

export default async function ProgressPage() {
  const { user } = await requireProfile();
  const data = await getProgressData(user.id);

  if (!data.hasAnyData) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Target size={32} className="mb-3 text-primary" />
        <h1 className="text-xl font-semibold">Ingen data än</h1>
        <p className="mt-2 max-w-sm text-muted">
          Din prognos börjar på 0 tills du har tränat. Gör en session eller det diagnostiska testet för att se din riktiga nivå.
        </p>
        <Link href="/practice" className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Börja träna
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Din utveckling</h1>
        <p className="mt-1 text-muted">Exakt var du ligger, delprov för delprov - och vad som ger mest poäng härnäst.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-primary/30 bg-primary-soft">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-primary">Total prognos</p>
            <p className="mt-1 text-3xl font-semibold">{formatScore(data.estimate.total)}</p>
            {data.goalScore !== null ? (
              <p className="mt-1 text-sm text-muted">
                mål {formatScore(data.goalScore)} · {data.gapTotal! > 0 ? `${formatScore(data.gapTotal)} kvar` : "målet nått!"}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                <Link href="/profile" className="text-primary hover:underline">
                  Sätt ett mål
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-verbal">Verbal del</p>
            <p className="mt-1 text-3xl font-semibold">{formatScore(data.estimate.verbal)}</p>
            <p className="mt-1 text-sm text-muted">av max 1,00 · ORD, LÄS, MEK, ELF</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-quant">Kvantitativ del</p>
            <p className="mt-1 text-3xl font-semibold">{formatScore(data.estimate.quant)}</p>
            <p className="mt-1 text-sm text-muted">av max 1,00 · XYZ, KVA, NOG, DTK</p>
          </CardContent>
        </Card>
      </div>

      {data.focusList.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              <h2 className="text-sm font-medium text-muted">Fokusera på detta härnäst</h2>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {data.focusList.map((s) => (
                <Link key={s.subtest} href={`/practice/run?minutes=15&subtests=${s.subtest}`}>
                  <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2 p-3.5 transition-colors hover:border-primary">
                    <p className="text-sm font-medium">{subtestLabel(s.subtest)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {s.weakestConcept ? s.weakestConcept.concept : "Otränad ännu"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">Träna 15 min →</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-medium text-muted">Alla delprov</h2>
          <div className="mt-3 flex flex-col divide-y divide-border">
            {data.subtests.map((s) => (
              <div key={s.subtest} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", s.isVerbal ? "bg-verbal" : "bg-quant")} />
                  <div>
                    <p className="text-sm font-medium">{subtestLabel(s.subtest)}</p>
                    <p className="text-xs text-muted">{s.attempts > 0 ? `${s.attempts} besvarade` : "Otränad"}</p>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-3">
                  <Progress
                    value={(s.score ?? 0) * 100}
                    className="flex-1"
                    colorClassName={s.isVerbal ? "bg-verbal" : "bg-quant"}
                  />
                  <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
                    {s.score !== null ? s.score.toFixed(2) : "–"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 sm:w-48 sm:shrink-0 sm:justify-end">
                  {s.accuracy !== null && <span className="text-xs text-muted">{Math.round(s.accuracy * 100)}% rätt</span>}
                  {s.trend !== null && s.trend !== 0 && (
                    <span className={cn("flex items-center gap-0.5 text-xs font-medium", s.trend > 0 ? "text-success" : "text-danger")}>
                      {s.trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(s.trend).toFixed(2)}
                    </span>
                  )}
                  <Link
                    href={`/practice/run?minutes=15&subtests=${s.subtest}`}
                    className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-primary-soft hover:text-primary"
                  >
                    Träna
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
