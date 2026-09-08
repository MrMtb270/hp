import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionForm } from "@/components/admin/question-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const q = await prisma.question.findUnique({ where: { id } });
  if (!q) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Redigera fråga</h1>
      <Card>
        <CardContent className="p-5">
          <QuestionForm
            questionId={q.id}
            initial={{
              subtest: q.subtest,
              concept: q.concept,
              difficulty: q.difficulty,
              stem: q.stem,
              options: JSON.parse(q.options),
              correctIndex: q.correctIndex,
              explanationShort: q.explanationShort,
              explanationSteps: JSON.parse(q.explanationSteps),
              hint1: q.hint1 ?? "",
              hint2: q.hint2 ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
