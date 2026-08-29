import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT_PATH = "/update-password";

/**
 * オープンリダイレクト対策: nextクエリパラメータは「このサイト内部への
 * 相対パス」である場合のみ許可する。
 *
 * - "/"で始まらない値(https://example.com、javascript:...等の絶対URL/
 *   scheme付きURLは"/"で始まらないため、ここで弾かれる)
 * - "//evil.example.com"のようなprotocol-relative URL("//"で始まる)
 * - "/\evil.example.com"のようなバックスラッシュを使った回避策
 *   (一部のブラウザ/プロキシが"\"を"/"として正規化し、実質的に
 *   protocol-relative URLとして扱われることがあるため)
 * のいずれかに該当する場合は無効とみなし、安全なデフォルト遷移先を返す。
 * URLSearchParams#get()は既にパーセントエンコードをデコード済みの値を返すため、
 * "%2F%2Fevil.example.com"のようなエンコードによる回避もここで検出できる。
 */
function resolveSafeNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return DEFAULT_NEXT_PATH;
  }
  if (!rawNext.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }
  if (rawNext.startsWith("//") || rawNext.startsWith("/\\")) {
    return DEFAULT_NEXT_PATH;
  }
  return rawNext;
}

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
  const next = resolveSafeNextPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/reset-password?error=expired");
}
