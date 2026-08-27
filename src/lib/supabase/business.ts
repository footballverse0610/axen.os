import "server-only";
import { createClient } from "./server";
import type { Business } from "./types";

/**
 * ログイン中ユーザーが所有する事業を作成日時の昇順で取得する。
 * business_id/user_idを引数で受け取らない設計にしているのは、
 * 「他ユーザーのbusiness_idを渡されて操作する」経路を作らないため。
 * 常にRLS(businesses.user_id = auth.uid())が絞り込みを行う。
 */
export async function getUserBusinesses(): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUserBusinesses failed", error);
    return [];
  }

  return data ?? [];
}

/**
 * 「現在選択中の事業」を返す基盤。
 * 複数事業の切り替えUIが実装されるまでは、最初に作成した事業を返す。
 * 将来、選択状態を(例: profilesの列やCookieで)永続化する場合は、
 * この関数の内部実装だけを差し替えれば呼び出し側は変更不要にする想定。
 */
export async function getCurrentBusiness(): Promise<Business | null> {
  const businesses = await getUserBusinesses();
  return businesses[0] ?? null;
}
