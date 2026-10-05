"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
];

/**
 * ライト/ダーク/システムの3択テーマ切り替え。
 * preferenceはuseSyncExternalStore経由で取得しているため、サーバーでの
 * 初回レンダリング("system"扱い)とクライアントの実際値が異なっていても
 * hydrationエラーにはならず、hydration直後に実際の選択値へ自動的に揃う。
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="テーマ"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isSelected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setPreference(value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary/[0.08] text-primary"
                : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={isSelected ? 2.25 : 1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
