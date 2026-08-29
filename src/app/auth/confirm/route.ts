import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * パスワード再設定メール内のリンクから戻ってくるRoute Handler。
 * Supabase公式のNext.js SSR向け推奨パターン(token_hash + verifyOtp)に
 * 従う。リンクのトークンをこのアプリ側で保存・管理することはせず、
 * Supabase Authへそのまま渡して検証するのみ。
 *
 * 検証に成功すると、Supabaseが正規のセッションCookieを発行する
 * (このアプリの既存のCookieベースセッション/RLSの前提をそのまま利用)。
 *
 * 対応するSupabase Dashboard側の設定(メールテンプレートでこのURLへ
 * token_hash/type/nextを渡すこと)は別途必要。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/update-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/reset-password?error=expired");
}
