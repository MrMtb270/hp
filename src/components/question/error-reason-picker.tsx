"use client";

import { cn } from "@/lib/utils";
import type { ErrorReason } from "@prisma/client";

const REASONS: { value: ErrorReason; label: string }[] = [
  { value: "CONCEPT", label: "Jag kunde inte konceptet" },
  { value: "CARELESS", label: "Jag slarvade" },
  { value: "MISREAD", label: "Jag läste fel" },
  { value: "TIME", label: "Jag hade slut på tid" },
  { value: "GUESS", label: "Jag gissade" },
  { value: "MISUNDERSTOOD", label: "Jag förstod inte frågan" },
];

export function ErrorReasonPicker({ onSelect, selected }: { onSelect: (r: ErrorReason) => void; selected: ErrorReason | null }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-muted">Varför blev det fel?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => onSelect(r.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selected === r.value ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/50"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
