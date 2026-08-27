import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16のProxy（旧middleware）。
 * 全ページアクセス時にSupabaseのセッションをリフレッシュする。
 * 認証必須ルートのリダイレクトは、Supabase Auth導入時にここへ追加する。
 *
 * .env.local が未設定の間（Supabase未接続の開発初期）は何もせずに
 * そのまま通す。既存のUIをSupabase未接続でも壊さないための措置。
 */
export async function proxy(request: NextRequest) {
  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パスに適用する:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico, 画像ファイル
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
