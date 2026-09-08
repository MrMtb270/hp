"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGoal } from "@/lib/actions/profile";
import { toast } from "sonner";

export function GoalEditor({ initialGoal, initialDate }: { initialGoal: number | null; initialDate: string | null }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal?.toString() ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await updateGoal(goal ? Number(goal) : null, date || null);
    setSaving(false);
    toast.success("Mål uppdaterat");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label className="text-xs text-muted">Målresultat</label>
        <Input type="number" step="0.05" min={0} max={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="t.ex. 1.60" />
      </div>
      <div className="flex-1">
        <label className="text-xs text-muted">Provdatum</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Sparar..." : "Spara"}
        </Button>
      </div>
    </div>
  );
}
