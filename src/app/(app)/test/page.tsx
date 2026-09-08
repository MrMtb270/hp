import Link from "next/link";
import { FileText, Clock } from "lucide-react";
import { listAvailableTests } from "@/lib/actions/test";
import { Card, CardContent } from "@/components/ui/card";

export default async function TestPage() {
  const tests = await listAvailableTests();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Övningsprov</h1>
        <p className="mt-1 text-muted">Realistisk provmiljö med tidtagning och fullständig analys efteråt.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((t) => (
          <Link key={t.id} href={`/test/run?testId=${t.id}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted">{t._count.questions} frågor · alla delprov</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock size={12} />
                  {Math.round((t._count.questions * 90) / 60)} min
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {tests.length === 0 && <p className="text-muted">Inga prov tillgängliga just nu.</p>}
      </div>
    </div>
  );
}
