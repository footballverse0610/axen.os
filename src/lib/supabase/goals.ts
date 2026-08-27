import "server-only";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import type { Business, Goal } from "./types";

/**
 * 現在の事業に紐づく目標を取得する(ステータス問わず全件)。
 * business_idは必ずgetCurrentBusiness()(RLSで絞り込まれたbusinessesから
 * 取得した値)を使用し、user_idによる手動フィルタは追加しない
 * (goalsのRLSがuser_id=auth.uid()を独立して保証する)。
 *
 * 取得失敗は詳細を伏せた汎用エラーとしてthrowし、
 * (main)/error.tsx のエラーバウンダリに処理を委ねる。
 */
export async function getBusinessGoals(): Promise<{
  business: Business | null;
  goals: Goal[];
}> {
  const business = await getCurrentBusiness();
  if (!business) {
    return { business: null, goals: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("business_id", business.id)
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBusinessGoals failed", error);
    throw new Error("目標を読み込めませんでした");
  }

  return { business, goals: data ?? [] };
}
