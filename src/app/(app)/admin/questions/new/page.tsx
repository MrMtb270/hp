import { requireAdmin } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionForm } from "@/components/admin/question-form";

export default async function NewQuestionPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ny fråga</h1>
      <Card>
        <CardContent className="p-5">
          <QuestionForm />
        </CardContent>
      </Card>
    </div>
  );
}
