import type { Transaction } from "./types";

export function sumByType(transactions: Transaction[], type: Transaction["type"]) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((total, t) => total + t.amount, 0);
}

export function calcProfit(transactions: Transaction[]) {
  const sales = sumByType(transactions, "sale");
  const expenses = sumByType(transactions, "expense");
  const profit = sales - expenses;
  const margin = sales === 0 ? 0 : Math.round((profit / sales) * 100);
  return { sales, expenses, profit, margin };
}

export function formatYen(amount: number) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}
