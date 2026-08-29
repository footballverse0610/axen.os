export function formatYen(amount: number) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}
