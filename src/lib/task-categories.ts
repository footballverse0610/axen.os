/**
 * Taskのカテゴリー候補(自由入力+候補選択方式)。
 * 以前のtask_category enum(supabase/migrations/001)と同じ6つを踏襲し、
 * 既存ユーザーの学習コストを増やさない。候補以外の値も自由に入力できる。
 */
export const TASK_CATEGORY_SUGGESTIONS = [
  "商品",
  "マーケティング",
  "営業",
  "資金調達",
  "運営",
  "その他",
] as const;

export const DEFAULT_TASK_CATEGORY = "その他";
