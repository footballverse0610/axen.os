import type { Expense, Sale } from "./types";

/**
 * 現在のbusinessの売上・経費・利益・利益率を計算する。
 * 利益率は売上が0の場合0%とし、四捨五入する。
 */
export function calcBusinessSummary(sales: Sale[], expenses: Expense[]) {
  const salesTotal = sales.reduce((total, s) => total + s.amount, 0);
  const expensesTotal = expenses.reduce((total, e) => total + e.amount, 0);
  const profit = salesTotal - expensesTotal;
  const margin = salesTotal === 0 ? 0 : Math.round((profit / salesTotal) * 100);

  return { sales: salesTotal, expenses: expensesTotal, profit, margin };
}

/** goals.current_value / target_value を0〜100%にクランプして返す */
export function calcGoalProgress(currentValue: number, targetValue: number) {
  if (targetValue <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));
}
