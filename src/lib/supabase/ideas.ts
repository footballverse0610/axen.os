import "server-only";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import type { Business, BusinessIdea } from "./types";

/**
 * 現在の事業に紐づくビジネスアイデアを取得する。
 * business_idは必ずgetCurrentBusiness()(RLSで絞り込まれたbusinessesから
 * 取得した値)を使用し、user_idによる手動フィルタは追加しない
 * (business_ideasのRLSがuser_id=auth.uid()を独立して保証する)。
 *
 * 個々のクエリ失敗は、詳細を伏せた汎用エラーとしてthrowし、
 * (main)/error.tsx のエラーバウンダリに処理を委ねる。
 * 「事業が0件(未設定)」はエラーではないため空配列を返す。
 */
export async function getBusinessIdeas(): Promise<{
  business: Business | null;
  ideas: BusinessIdea[];
}> {
  const business = await getCurrentBusiness();
  if (!business) {
    return { business: null, ideas: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_ideas")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBusinessIdeas failed", error);
    throw new Error("アイデアを読み込めませんでした");
  }

  return { business, ideas: data ?? [] };
}
