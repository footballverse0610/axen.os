/**
 * Finance(売上・経費)のカテゴリー候補(自由入力+候補選択方式)。
 * sales.category/expenses.categoryはDB上もともとtext型(enum制約なし)のため、
 * migration不要でUI側の変更のみで対応できる。
 */
export const SALE_CATEGORY_SUGGESTIONS = [
  "商品売上",
  "サービス売上",
  "受託・制作",
  "サブスク収益",
  "その他",
] as const;

export const EXPENSE_CATEGORY_SUGGESTIONS = [
  "広告費",
  "仕入れ",
  "人件費",
  "外注費",
  "交通費",
  "ツール・サービス",
  "その他",
] as const;
