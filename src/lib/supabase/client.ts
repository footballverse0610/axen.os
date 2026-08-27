import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * ブラウザ（Client Component）から使うSupabaseクライアント。
 * anon keyのみを使用する（RLSにより行アクセスが制御される前提）。
 * Service Role Keyは絶対にこのファイルへ持ち込まないこと。
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
