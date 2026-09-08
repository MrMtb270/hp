"use client";

import { useState } from "react";
import { createQuestion, updateQuestion, type QuestionInput } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subtestLabel } from "@/lib/utils";
import type { Subtest } from "@prisma/client";

const SUBTESTS: Subtest[] = ["ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"];

export function QuestionForm({ questionId, initial }: { questionId?: string; initial?: QuestionInput }) {
  const [subtest, setSubtest] = useState<Subtest>(initial?.subtest ?? "ORD");
  const [concept, setConcept] = useState(initial?.concept ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 1000);
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [explanationShort, setExplanationShort] = useState(initial?.explanationShort ?? "");
  const [explanationSteps, setExplanationSteps] = useState(initial?.explanationSteps.join("\n") ?? "");
  const [hint1, setHint1] = useState(initial?.hint1 ?? "");
  const [hint2, setHint2] = useState(initial?.hint2 ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: QuestionInput = {
      subtest,
      concept,
      difficulty,
      stem,
      options,
      correctIndex,
      explanationShort,
      explanationSteps: explanationSteps.split("\n").filter(Boolean),
      hint1,
      hint2,
    };
    if (questionId) {
      await updateQuestion(questionId, input);
    } else {
      await createQuestion(input);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted">Delprov</label>
          <select
            value={subtest}
            onChange={(e) => setSubtest(e.target.value as Subtest)}
            className="mt-1 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
          >
            {SUBTESTS.map((s) => (
              <option key={s} value={s}>
                {subtestLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted">Koncept</label>
          <Input value={concept} onChange={(e) => setConcept(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted">Svårighetsgrad (Elo, ca 600-1500)</label>
        <Input type="number" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
      </div>

      <div>
        <label className="text-xs text-muted">Frågetext</label>
        <textarea
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          required
          rows={4}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="text-xs text-muted">Svarsalternativ (markera rätt svar)</label>
        <div className="mt-1 flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
              <Input
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                required
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted">Kort förklaring</label>
        <textarea
          value={explanationShort}
          onChange={(e) => setExplanationShort(e.target.value)}
          required
          rows={2}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="text-xs text-muted">Steg-för-steg (en rad per steg)</label>
        <textarea
          value={explanationSteps}
          onChange={(e) => setExplanationSteps(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted">Ledtråd nivå 1</label>
          <Input value={hint1} onChange={(e) => setHint1(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted">Ledtråd nivå 2</label>
          <Input value={hint2} onChange={(e) => setHint2(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="mt-2">
        {saving ? "Sparar..." : questionId ? "Spara ändringar" : "Skapa fråga"}
      </Button>
    </form>
  );
}
