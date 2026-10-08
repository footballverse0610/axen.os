import "server-only";
import { getAnthropicClient, COACH_MODEL } from "../anthropic/client";
import type { CoachContext } from "../supabase/coach-context";
import { isCoachMockModeEnabled } from "./mock-mode";
import { streamMockCoachReply } from "./mock-provider";
import {
  COACH_ACTIONS_MARKER,
  PROPOSE_ACTIONS_TOOL,
  hasAnyCoachActions,
  sanitizeCoachActions,
} from "./actions-schema";

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
    // propose_actionsツール呼び出し分の出力トークンも必要なため、通常の
    // 会話テキストのみだった頃より少し余裕を持たせる。
    max_tokens: 3072,
    system: params.systemPrompt,
    messages: params.messages,
    tools: [PROPOSE_ACTIONS_TOOL],
  });

  for await (const event of claudeStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }

  const finalMessage = await claudeStream.finalMessage();
  const toolUseBlock = finalMessage.content.find(
    (block) => block.type === "tool_use" && block.name === "propose_actions",
  );
  if (toolUseBlock && toolUseBlock.type === "tool_use") {
    const actions = sanitizeCoachActions(toolUseBlock.input);
    if (hasAnyCoachActions(actions)) {
      // 会話テキストの後ろに、既存のプレーンテキストストリームの延長として
      // マーカー+JSONを1チャンクだけ追加する(新しいレスポンス形式は導入しない)。
      yield `${COACH_ACTIONS_MARKER}${JSON.stringify(actions)}`;
    }
  }
}
