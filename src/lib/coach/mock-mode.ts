import "server-only";

/**
 * AI CoachのMock Providerを使うかどうかを判定する。
 *
 * 安全側の設計: 以下を「両方」満たした場合のみtrueになる。
 *   1. process.env.NODE_ENV === "development"
 *      (`next build` / `next start` は自動的にNODE_ENV=productionになるため、
 *      本番ビルド・本番起動では COACH_MOCK_MODE の値に関わらず絶対に有効化されない)
 *   2. process.env.COACH_MOCK_MODE === "true" (開発者が.env.localで明示的にON)
 *
 * どちらか一方でも満たさなければ、必ず実際のAnthropic API(src/lib/anthropic/)を
 * 使う経路になる。
 */
export function isCoachMockModeEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.COACH_MOCK_MODE === "true";
}
