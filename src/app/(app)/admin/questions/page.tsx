import Link from "next/link";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { subtestLabel } from "@/lib/utils";
import { DeleteQuestionButton } from "@/components/admin/delete-question-button";

export default async function AdminQuestionsPage() {
  await requireAdmin();
  const questions = await prisma.question.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Frågor</h1>
          <p className="mt-1 text-muted">{questions.length} frågor totalt</p>
        </div>
        <Link href="/admin/questions/new" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Ny fråga
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="p-3">Delprov</th>
                  <th className="p-3">Koncept</th>
                  <th className="p-3">Fråga</th>
                  <th className="p-3">Svårighet</th>
                  <th className="p-3">Träffsäkerhet</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0">
                    <td className="p-3">{subtestLabel(q.subtest)}</td>
                    <td className="p-3 text-muted">{q.concept}</td>
                    <td className="max-w-xs truncate p-3">{q.stem}</td>
                    <td className="p-3">{Math.round(q.difficulty)}</td>
                    <td className="p-3">{q.timesAnswered > 0 ? `${Math.round((q.timesCorrect / q.timesAnswered) * 100)}%` : "–"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/questions/${q.id}/edit`} className="text-primary hover:underline">
                          Redigera
                        </Link>
                        <DeleteQuestionButton id={q.id} />
                      </div>
                    </td>
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
