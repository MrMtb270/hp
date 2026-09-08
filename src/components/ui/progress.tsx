import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  colorClassName = "bg-primary",
  trackClassName = "bg-surface-2",
}: {
  value: number;
  className?: string;
  colorClassName?: string;
  trackClassName?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full", trackClassName, className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colorClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
