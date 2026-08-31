import type { BadgeTone } from "@/components/ui/Badge";

export type DueUrgency = "overdue" | "today" | "tomorrow" | "soon" | "later" | "none";

/**
 * due_date(YYYY-MM-DD)から、今日を基準にした緊急度を求める。
 * タイムゾーンのズレを避けるため、日付文字列同士の差分で計算する
 * (Dateのローカルタイムゾーン変換に依存しない)。
 */
export function calcDueUrgency(dueDate: string | null): DueUrgency {
  if (!dueDate) return "none";

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  if (dueDate < todayStr) return "overdue";
  if (dueDate === todayStr) return "today";

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
    tomorrow.getDate(),
  ).padStart(2, "0")}`;
  if (dueDate === tomorrowStr) return "tomorrow";

  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = `${weekAhead.getFullYear()}-${String(weekAhead.getMonth() + 1).padStart(2, "0")}-${String(
    weekAhead.getDate(),
  ).padStart(2, "0")}`;
  if (dueDate <= weekAheadStr) return "soon";

  return "later";
}

export const dueUrgencyLabel: Record<DueUrgency, string | null> = {
  overdue: "期限切れ",
  today: "今日",
  tomorrow: "明日",
  soon: "今週中",
  later: null,
  none: null,
};

export const dueUrgencyTone: Record<DueUrgency, BadgeTone> = {
  overdue: "critical",
  today: "critical",
  tomorrow: "warning",
  soon: "neutral",
  later: "neutral",
  none: "neutral",
};
