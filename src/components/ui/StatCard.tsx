import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "good",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "critical";
  icon?: LucideIcon;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {delta ? (
          <span
            className={`text-xs font-medium ${
              deltaTone === "good" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
