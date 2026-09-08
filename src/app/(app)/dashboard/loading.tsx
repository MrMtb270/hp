function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-md)] bg-surface-2 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Block className="h-7 w-64" />
        <Block className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-[84px]" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Block className="h-44 md:col-span-2" />
        <Block className="h-44" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Block className="h-48 md:col-span-2" />
        <Block className="h-48" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Block className="h-32" />
        <Block className="h-32" />
      </div>
    </div>
  );
}
