function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <SkeletonBlock className="h-6 w-24 border-none bg-surface-muted/70" />
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-4 w-20 border-none bg-surface-muted/70" />
        <SkeletonBlock className="h-40" />
      </div>
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-4 w-16 border-none bg-surface-muted/70" />
        <SkeletonBlock className="h-32" />
      </div>
    </div>
  );
}
