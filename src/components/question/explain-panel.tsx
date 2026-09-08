"use client";

import { useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { requestExplanation, requestHint } from "@/lib/actions/ai";
import type { ExplanationStyle, HintLevel } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const STYLES: { value: ExplanationStyle; label: string }[] = [
  { value: "short", label: "Kort förklaring" },
  { value: "steps", label: "Steg för steg" },
  { value: "eli5", label: "Förklara som nybörjare" },
  { value: "similar", label: "Liknande fråga" },
];

export function ExplainPanel({ questionId, selectedIndex }: { questionId: string; selectedIndex: number | null }) {
  const [style, setStyle] = useState<ExplanationStyle | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function pick(s: ExplanationStyle) {
    setStyle(s);
    setLoading(true);
    const res = await requestExplanation({ questionId, selectedIndex, style: s });
    setText(res.text);
    setLoading(false);
  }

  return (
    <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap gap-1.5">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => pick(s.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              style === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> AI-coachen funderar...
        </div>
      )}
      {!loading && text && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{text}</p>}
    </div>
  );
}

export function HintButton({ questionId }: { questionId: string }) {
  const [level, setLevel] = useState<0 | HintLevel>(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function nextHint() {
    if (level >= 4) return;
    const newLevel = (level + 1) as HintLevel;
    setLoading(true);
    const res = await requestHint({ questionId, level: newLevel });
    setText(res.text);
    setLevel(newLevel);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={nextHint}
        disabled={loading || level >= 4}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        <Lightbulb size={14} />
        {level === 0 ? "Ge mig en ledtråd" : level >= 4 ? "Inga fler ledtrådar" : `Nästa ledtråd (${level}/4)`}
      </button>
      {text && (
        <p className="mt-2 rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-sm text-foreground">
          {loading ? "..." : text}
        </p>
      )}
    </div>
  );
}
