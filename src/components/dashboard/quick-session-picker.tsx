"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

const DURATIONS = [5, 10, 20, 30, 60];

export function QuickSessionPicker({ recommendedSubtests }: { recommendedSubtests: string[] }) {
  const router = useRouter();

  function start(minutes: number) {
    const params = new URLSearchParams();
    params.set("minutes", String(minutes));
    if (recommendedSubtests.length > 0) params.set("subtests", recommendedSubtests.join(","));
    router.push(`/practice/run?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DURATIONS.map((m) => (
        <button
          key={m}
          onClick={() => start(m)}
          className="group flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-primary-soft hover:text-primary active:scale-95"
        >
          <Zap size={14} className="text-accent group-hover:text-primary" />
          {m} min
        </button>
      ))}
    </div>
  );
}
