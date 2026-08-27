function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

export default function MainLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-4 w-24 border-none bg-surface-muted/70" />
        <SkeletonBlock className="h-6 w-48 border-none bg-surface-muted/70" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>

      <SkeletonBlock className="h-20" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}
