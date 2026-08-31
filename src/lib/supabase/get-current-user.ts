import "server-only";
import { cache } from "react";
import { createClient } from "./server";

/**
 * Server Component / Server Action から認証済みユーザーを取得する。
 * 未ログイン、またはSupabase未接続(.env.local未設定)の場合は null を返す
 * (呼び出し側のレイアウトを壊さないため、ここで例外を握りつぶす)。
 *
 * React cache()で1リクエスト内の呼び出しをメモ化する。supabase.auth.getUser()は
 * Supabase Authサーバーへの毎回のネットワーク往復を伴うため、layout.tsx +
 * 各page.tsxなど、同一リクエスト内で複数回呼ばれても実際の呼び出しは1回だけになる
 * (cache()はリクエストごとに独立しており、ユーザー間でキャッシュが漏れることはない)。
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});
