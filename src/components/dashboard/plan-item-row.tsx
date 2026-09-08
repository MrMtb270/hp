"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Check, Coffee } from "lucide-react";
import { markPlanItemDone } from "@/lib/actions/plan";
import { cn, formatMinutes } from "@/lib/utils";
import { dayName } from "@/lib/studyPlan";

export function PlanItemRow({
  item,
  isToday,
}: {
  item: { id: string; dayOfWeek: number; label: string; minutes: number; done: boolean; subtest: string | null };
  isToday: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const href = item.minutes > 0 ? `/practice/run?minutes=${item.minutes}${item.subtest ? `&subtests=${item.subtest}` : ""}` : null;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3",
        isToday ? "border-primary bg-primary-soft" : "border-border bg-surface",
        item.done && "opacity-60"
      )}
    >
      <div>
        <p className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted")}>{dayName(item.dayOfWeek)}</p>
        <p className="text-sm font-medium">{item.label}</p>
        <p className="text-xs text-muted">{item.minutes > 0 ? formatMinutes(item.minutes) : "Vila"}</p>
      </div>
      <div className="flex items-center gap-2">
        {item.done ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={16} />
          </span>
        ) : item.minutes === 0 ? (
          <Coffee size={18} className="text-muted" />
        ) : (
          href && (
            <Link
              href={href}
              onClick={() =>
                startTransition(async () => {
                  await markPlanItemDone(item.id);
                  router.refresh();
                })
              }
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {pending ? "..." : "Starta"}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
