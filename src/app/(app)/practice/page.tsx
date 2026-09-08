import Link from "next/link";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { SubtestPicker } from "@/components/dashboard/subtest-picker";
import { subtestLabel } from "@/lib/utils";

const ALL_SUBTESTS = ["ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"];

export default async function PracticePage() {
  const user = await requireUser();
  const dueCount = await prisma.conceptMastery.count({ where: { userId: user.id, nextReviewAt: { lte: new Date() } } });

  const masteries = await prisma.conceptMastery.findMany({ where: { userId: user.id } });
  const bySubtest = new Map<string, { rating: number; count: number }>();
  for (const m of masteries) {
    const b = bySubtest.get(m.subtest) ?? { rating: 0, count: 0 };
    b.rating += m.rating;
    b.count += 1;
    bySubtest.set(m.subtest, b);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Träna</h1>
        <p className="mt-1 text-muted">Välj delprov och tid, eller låt oss välja åt dig.</p>
      </div>

      {dueCount > 0 && (
        <Link href="/practice/run?mode=review" className="block">
          <Card className="border-accent/40 bg-accent-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{dueCount} koncept redo för repetition</p>
                <p className="text-sm text-muted">Perfekt timing för att befästa det du lärt dig.</p>
              </div>
              <span className="text-2xl">🔁</span>
            </CardContent>
          </Card>
        </Link>
      )}

      <SubtestPicker />

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Dina delprov</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ALL_SUBTESTS.map((s) => {
            const b = bySubtest.get(s);
            const avg = b ? Math.round(b.rating / b.count) : 1000;
            return (
              <Link key={s} href={`/practice/run?minutes=10&subtests=${s}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{subtestLabel(s)}</p>
                    <p className="mt-1 text-xs text-muted">{b ? `rating ${Math.round(avg)}` : "otränad"}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
