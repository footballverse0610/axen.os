import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

function requireServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください（.env.example を参照）。",
    );
  }
  return key;
}

/**
 * Service Role Keyを使う管理者権限のSupabaseクライアント。RLSを完全に
 * バイパスするため、"server-only"のファイルからのみimportし、ユーザー入力を
 * そのままクエリに使うような用途には使わないこと。
 * 現時点ではdeleteAccount() (src/lib/supabase/actions.ts) でのみ使用する。
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = requireServiceRoleKey();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
