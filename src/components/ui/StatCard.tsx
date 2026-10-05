import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "good",
  icon: Icon,
  emphasize = false,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "critical";
  icon?: LucideIcon;
  /** 最も重要な数値であることをPrimaryカラーで示す(多用しない)。 */
  emphasize?: boolean;
}) {
  return (
    <Card variant={emphasize ? "primary" : "standard"} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon ? (
          <Icon
            className={`h-4 w-4 ${emphasize ? "text-primary" : "text-muted-foreground"}`}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={`text-2xl font-semibold tracking-tight ${
            emphasize ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {delta ? (
          <span
            className={`text-xs font-medium ${
              deltaTone === "good" ? "text-green-400" : "text-red-400"
            }`}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
