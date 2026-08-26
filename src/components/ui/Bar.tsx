export function Bar({
  value,
  max,
  tone = "neutral",
}: {
  value: number;
  max: number;
  tone?: "neutral" | "good" | "critical";
}) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const fillClass =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "critical"
        ? "bg-red-400"
        : "bg-foreground";

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${fillClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
