import "server-only";
import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "./types";

/**
 * ログイン中ユーザー自身のprofilesレコードを取得する。
 * user_idを引数で受け取らない設計にしているのは、他ユーザーのprofilesを
 * 取得する経路を作らないため。常にRLS(profiles_select_own:
 * auth.uid() = id)が絞り込みを行う。
 *
 * profilesはensureProfileExists()によりログイン/サインアップ時に
 * 作成される想定だが、未作成でも画面が壊れないようnullを返す
 * (display_nameは未設定表示にフォールバックする)。
 *
 * React cache()で1リクエスト内の呼び出しをメモ化する((main)/layout.tsxと
 * settings/page.tsx等が同一リクエスト内でそれぞれ呼ぶため)。
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();

  if (error) {
    console.error("getCurrentProfile failed", error);
    return null;
  }

  return data;
});
