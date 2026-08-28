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
 * 評価しない）。env.tsのgetSupabaseEnv()と同じ理由: ANTHROPIC_API_KEYが
 * 未設定でも、AI Coach機能を使わないページ・ビルド処理を壊さないため。
 */
export function getAnthropicEnv() {
  return {
    apiKey: requireEnv("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY),
  };
}
