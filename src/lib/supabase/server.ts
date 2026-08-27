import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Server Component / Server Action / Route Handler から使うSupabaseクライアント。
 * anon keyのみを使用し、Cookieに保存されたユーザーのセッションを介して
 * RLSが適用される（管理者権限のService Role Keyはここでは使わない）。
 *
 * 注意: Server Componentからはcookieの書き込みができないため、setAllは
 * 失敗を握りつぶす。セッションの実際の更新は src/proxy.ts が担う。
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Componentから呼ばれた場合はここに到達するが、
          // セッションの更新はproxy.ts側で行われるため無視してよい。
        }
      },
    },
  });
}
