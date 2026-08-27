import "server-only";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import type { Business, Task } from "./types";

/**
 * 現在の事業に紐づく全タスク(未完了・完了済み両方)を取得する。
 * business_idは必ずgetCurrentBusiness()(RLSで絞り込まれたbusinessesから
 * 取得した値)を使用し、user_idによる手動フィルタは追加しない
 * (tasksのRLSがuser_id=auth.uid()を独立して保証する)。
 *
 * 取得失敗は、詳細を伏せた汎用エラーとしてthrowし、
 * (main)/error.tsx のエラーバウンダリに処理を委ねる。
 * 「事業が0件(未設定)」はエラーではないため空配列を返す。
 */
export async function getBusinessTasks(): Promise<{
  business: Business | null;
  tasks: Task[];
}> {
  const business = await getCurrentBusiness();
  if (!business) {
    return { business: null, tasks: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBusinessTasks failed", error);
    throw new Error("タスクを読み込めませんでした");
  }

  return { business, tasks: data ?? [] };
}
