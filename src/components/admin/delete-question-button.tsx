"use client";

import { useTransition } from "react";
import { deleteQuestion } from "@/lib/actions/admin";
import { toast } from "sonner";

export function DeleteQuestionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Ta bort frågan permanent?")) return;
    startTransition(async () => {
      await deleteQuestion(id);
      toast.success("Fråga borttagen");
    });
  }

  return (
    <button onClick={handleDelete} disabled={pending} className="text-danger hover:underline disabled:opacity-50">
      {pending ? "Tar bort..." : "Ta bort"}
    </button>
  );
}
