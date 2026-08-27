import "server-only";
import { createClient } from "./server";

/**
 * Server Component / Server Action から認証済みユーザーを取得する。
 * 未ログイン、またはSupabase未接続(.env.local未設定)の場合は null を返す
 * (呼び出し側のレイアウトを壊さないため、ここで例外を握りつぶす)。
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
