function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

export default function StartGuideLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-6 w-40 border-none bg-surface-muted/70" />
        <SkeletonBlock className="h-4 w-64 border-none bg-surface-muted/70" />
      </div>
      <SkeletonBlock className="h-56" />
    </div>
  );
}
