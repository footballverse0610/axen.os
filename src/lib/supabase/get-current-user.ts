import "server-only";
import { createClient } from "./server";

/**
 * Server Component / Server Action から認証済みユーザーを取得する。
 * 未ログインの場合は user が null になる。
 * 現時点ではどの画面からも呼び出されていない（次のPhaseでUIと接続する）。
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
