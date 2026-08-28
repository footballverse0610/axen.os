function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

export default function CoachLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-full border-none bg-surface-muted/70" />
        <div className="flex flex-col gap-1.5">
          <SkeletonBlock className="h-3.5 w-32 border-none bg-surface-muted/70" />
          <SkeletonBlock className="h-3 w-48 border-none bg-surface-muted/70" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-16 w-3/4" />
        <SkeletonBlock className="ml-auto h-10 w-1/2" />
        <SkeletonBlock className="h-16 w-3/4" />
      </div>
    </div>
  );
}
