import type { Expense, GoalType, Sale } from "./types";

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

/** current_valueをFinanceから自動計算するgoal_type(DATABASE_DESIGN.md 4.3参照) */
export const LINKED_GOAL_TYPES = ["revenue", "profit", "sales_count"] as const;

/**
 * revenue/profit/sales_count型の目標の現在値を、start_date〜(target_dateまたは今日)の
 * sales/expensesから算出する(DATABASE_DESIGN.md 4.3の計算式)。
 * custom型はこの関数の対象外(goals.current_valueをそのまま使う)。
 * goals.current_valueはDB制約でnumeric(12,2) >= 0のため、profitが赤字の場合は
 * 0にクランプする(実際の赤字額はFinance側の利益表示で確認できる)。
 */
export function calcLinkedGoalValue(
  goalType: GoalType,
  startDate: string,
  targetDate: string | null,
  sales: Sale[],
  expenses: Expense[],
): number {
  const endDate = targetDate ?? new Date().toISOString().slice(0, 10);
  const inRange = (date: string) => date >= startDate && date <= endDate;

  if (goalType === "revenue") {
    return sales.filter((s) => inRange(s.sold_on)).reduce((sum, s) => sum + s.amount, 0);
  }
  if (goalType === "sales_count") {
    return sales.filter((s) => inRange(s.sold_on)).length;
  }
  if (goalType === "profit") {
    const salesTotal = sales.filter((s) => inRange(s.sold_on)).reduce((sum, s) => sum + s.amount, 0);
    const expensesTotal = expenses
      .filter((e) => inRange(e.spent_on))
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, salesTotal - expensesTotal);
  }
  return 0;
}

/** 目標カードの+/-ボタンの増減幅を、目標値の桁数に応じたきりのよい数値で提案する */
export function suggestGoalStep(targetValue: number): number {
  if (targetValue >= 100000) return 10000;
  if (targetValue >= 10000) return 1000;
  if (targetValue >= 1000) return 100;
  if (targetValue >= 100) return 10;
  return 1;
}
