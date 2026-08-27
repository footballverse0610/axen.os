function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-4 w-56 border-none bg-surface-muted/70" />
        <SkeletonBlock className="h-8 w-20 rounded-full border-none bg-surface-muted/70" />
      </div>
      <SkeletonBlock className="h-4 w-24 border-none bg-surface-muted/70" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
