"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, subtestLabel } from "@/lib/utils";

const SUBTESTS = ["ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"];
const DURATIONS = [10, 20, 30];

export function SubtestPicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(20);

  function toggle(s: string) {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function start() {
    const params = new URLSearchParams();
    params.set("minutes", String(minutes));
    if (selected.length > 0) params.set("subtests", selected.join(","));
    router.push(`/practice/run?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-sm font-medium text-muted">Bygg din egen session</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUBTESTS.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selected.includes(s) ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/50"
              )}
            >
              {subtestLabel(s)}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {DURATIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  minutes === m ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/50"
                )}
              >
                {m} min
              </button>
            ))}
          </div>
          <Button onClick={start}>Starta</Button>
        </div>
      </CardContent>
    </Card>
  );
}
