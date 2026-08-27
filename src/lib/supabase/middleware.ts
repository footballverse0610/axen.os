import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * src/proxy.ts から呼び出すセッション更新処理。
 * 期限切れが近いアクセストークンをリフレッシュし、更新後のCookieを
 * レスポンスに反映する。Supabase Auth導入後、認証必須ページのリダイレクト
 * もここに追加していく想定（現時点ではセッション維持のみ）。
 *
 * 呼び出し側（proxy.ts）が環境変数の有無を先に確認する想定だが、
 * 念のためこの関数自体もgetSupabaseEnv()経由で検証する。
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser()はSupabaseサーバーに問い合わせて検証するため、getSession()より安全。
  // 戻り値は現時点では未使用だが、呼び出すこと自体がトークンのリフレッシュに必要。
  await supabase.auth.getUser();

  return supabaseResponse;
}
