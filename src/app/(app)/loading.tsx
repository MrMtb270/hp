function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-md)] bg-surface-2 ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonBlock className="h-40 md:col-span-2" />
        <SkeletonBlock className="h-40" />
      </div>
    </div>
  );
}
