import "server-only";
import { createClient } from "./server";
import type { CoachMessage } from "./types";

/** 1回の画面表示・1回のAIへの会話履歴として渡す最大件数 */
const HISTORY_LIMIT = 30;

/** 1事業・1日あたりのユーザーメッセージ上限 */
export const DAILY_MESSAGE_LIMIT = 20;

/**
 * 指定businessのAI Coach会話履歴を新しい順に取得し、表示用に古い順へ並び替えて返す。
 * business_idは呼び出し側がgetCurrentBusiness()から取得した値を渡す想定。
 * user_idによる手動フィルタは追加しない(coach_messagesのRLSが
 * user_id=auth.uid()を独立して保証するため)。
 */
export async function getCoachMessages(businessId: string): Promise<CoachMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_messages")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("getCoachMessages failed", error);
    return [];
  }

  return (data ?? []).slice().reverse();
}

/**
 * coach_messagesへ1件挿入する。user_id/business_idは呼び出し側が
 * サーバー側で取得した値のみを渡すこと(クライアント入力を信用しない)。
 */
export async function insertCoachMessage(params: {
  businessId: string;
  userId: string;
  role: "user" | "coach";
  content: string;
}): Promise<CoachMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_messages")
    .insert({
      business_id: params.businessId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("insertCoachMessage failed", error);
    throw new Error("メッセージの保存に失敗しました");
  }

  return data;
}

/**
 * 指定businessにおける「本日(UTC暦日)」のユーザーメッセージ件数を返す。
 * 1事業1日あたりのレート制限判定に使う。
 */
export async function countTodayUserMessages(businessId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const todayStartUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();

  const { count, error } = await supabase
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("role", "user")
    .gte("created_at", todayStartUtc);

  if (error) {
    console.error("countTodayUserMessages failed", error);
    throw new Error("利用状況の確認に失敗しました");
  }

  return count ?? 0;
}
