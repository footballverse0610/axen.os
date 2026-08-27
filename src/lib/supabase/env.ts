function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} が設定されていません。.env.local を確認してください（.env.example を参照）。`,
    );
  }
  return value;
}

/**
 * 呼び出された時点で初めて環境変数を検証する（モジュール読み込み時には
 * 評価しない）。proxy.ts のように、Supabase未接続でも動作し続ける必要が
 * ある場所からimportされても、この関数を呼ばない限りエラーにならない。
 */
export function getSupabaseEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}
