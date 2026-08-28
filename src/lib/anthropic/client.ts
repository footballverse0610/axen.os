import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "./env";

/**
 * サーバー専用のAnthropicクライアント。
 * ANTHROPIC_API_KEYはこのファイル(サーバー側)以外からは参照しない。
 * クライアント(ブラウザ)へ渡る経路は存在しない
 * (Route Handler内でのみ使用し、レスポンスにはAPIキーを含めない)。
 *
 * getSupabaseEnv()と同様、呼び出された時点で初めて環境変数を検証するため、
 * このモジュールをimportしただけでは例外を投げない。
 */
export function getAnthropicClient(): Anthropic {
  const { apiKey } = getAnthropicEnv();
  return new Anthropic({ apiKey });
}

export const COACH_MODEL = "claude-sonnet-5";
