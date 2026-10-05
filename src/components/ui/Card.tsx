import type { HTMLAttributes } from "react";

export type CardVariant = "standard" | "primary" | "secondary";

/**
 * 3段階のカード階層。
 * - primary: 最も重要な情報(今日やること、AIコーチ誘導など)。Primaryカラーの
 *   ごく薄いtintと縁取りで強調するが、背景全体を塗るほど強くはしない。
 * - standard: 通常のカード(既存のCardと同じ見た目)。
 * - secondary: 補足的な情報。borderをやや弱くし、shadowなしで一段落ち着かせる。
 */
const variantClasses: Record<CardVariant, string> = {
  standard: "border-border bg-surface shadow-[var(--shadow-card)]",
  primary: "border-primary/15 bg-primary/[0.04] shadow-[var(--shadow-card-primary)]",
  secondary: "border-border/70 bg-surface-muted/60 shadow-none",
};

export function Card({
  className = "",
  variant = "standard",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
