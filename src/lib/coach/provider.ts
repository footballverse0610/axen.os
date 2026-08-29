import "server-only";
import { getAnthropicClient, COACH_MODEL } from "../anthropic/client";
import type { CoachContext } from "../supabase/coach-context";
import { isCoachMockModeEnabled } from "./mock-mode";
import { streamMockCoachReply } from "./mock-provider";

export interface CoachConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Coachの応答をテキストチャンクのasyncイテレータとして返す。
 *
 * isCoachMockModeEnabled()がtrueの場合のみMock Providerを使い、Anthropic API
 * は一切呼び出さない(client.messages.streamにすら到達しない)。それ以外は
 * 常に実際のsrc/lib/anthropic経由でClaudeを呼び出す既存の経路を通る
 * (src/lib/anthropic/以下の実装自体は変更していない)。
 */
export async function* streamCoachReply(params: {
  systemPrompt: string;
  messages: CoachConversationMessage[];
  userMessage: string;
  context: CoachContext;
}): AsyncGenerator<string> {
  if (isCoachMockModeEnabled()) {
    yield* streamMockCoachReply({ userMessage: params.userMessage, context: params.context });
    return;
  }

  const client = getAnthropicClient();
  const claudeStream = client.messages.stream({
    model: COACH_MODEL,
    max_tokens: 2048,
    system: params.systemPrompt,
    messages: params.messages,
  });

  for await (const event of claudeStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }

  await claudeStream.finalMessage();
}
