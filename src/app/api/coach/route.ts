import { NextResponse } from "next/server";
import { getAnthropicClient, COACH_MODEL } from "@/lib/anthropic/client";
import { buildCoachSystemPrompt } from "@/lib/anthropic/system-prompt";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getCoachContext } from "@/lib/supabase/coach-context";
import {
  countTodayUserMessages,
  DAILY_MESSAGE_LIMIT,
  getCoachMessages,
  insertCoachMessage,
} from "@/lib/supabase/coach-messages";

const MAX_MESSAGE_LENGTH = 4000;

/**
 * AI Coachへメッセージを送信するRoute Handler。
 *
 * Server Actionではなくこちらを使う理由: Claudeのストリーミング応答を
 * そのままブラウザへ逐次転送するため(Server Actionはストリーミング
 * レスポンスに向かない)。
 *
 * このパスはsrc/proxy.tsの保護対象に含めていない(リダイレクトはfetch
 * クライアントに不向きなため)。代わりにこの関数内で自前の認証チェックを行い、
 * 未ログインの場合は401 JSONを返す。
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? (body as { message: unknown }).message
      : undefined;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `メッセージは${MAX_MESSAGE_LENGTH}文字以内で入力してください` },
      { status: 400 },
    );
  }
  const trimmedMessage = message.trim();

  // business_idはクライアント入力を一切信用せず、サーバー側で解決したものだけを使う。
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "事業情報が見つかりません" }, { status: 400 });
  }

  let todayCount: number;
  try {
    todayCount = await countTodayUserMessages(business.id);
  } catch {
    return NextResponse.json({ error: "利用状況の確認に失敗しました" }, { status: 500 });
  }
  if (todayCount >= DAILY_MESSAGE_LIMIT) {
    return NextResponse.json(
      {
        error: `本日のAI Coach利用上限(1事業あたり${DAILY_MESSAGE_LIMIT}メッセージ)に達しました。また明日ご利用ください。`,
      },
      { status: 429 },
    );
  }

  const history = await getCoachMessages(business.id);

  let context;
  try {
    context = await getCoachContext();
  } catch {
    return NextResponse.json({ error: "事業データの取得に失敗しました" }, { status: 500 });
  }
  if (!context) {
    return NextResponse.json({ error: "事業情報が見つかりません" }, { status: 400 });
  }

  try {
    await insertCoachMessage({
      businessId: business.id,
      userId: user.id,
      role: "user",
      content: trimmedMessage,
    });
  } catch {
    return NextResponse.json({ error: "メッセージの保存に失敗しました" }, { status: 500 });
  }

  const systemPrompt = buildCoachSystemPrompt(context);
  const claudeMessages = [
    ...history.map((m) => ({
      role: (m.role === "coach" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    })),
    { role: "user" as const, content: trimmedMessage },
  ];

  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        const claudeStream = client.messages.stream({
          model: COACH_MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: claudeMessages,
        });

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        await claudeStream.finalMessage();

        if (fullText.trim().length > 0) {
          await insertCoachMessage({
            businessId: business.id,
            userId: user.id,
            role: "coach",
            content: fullText,
          });
        }
      } catch (err) {
        console.error("coach route: Claude streaming failed", err);
        if (fullText.length === 0) {
          controller.enqueue(
            encoder.encode("すみません、応答の生成中にエラーが発生しました。もう一度お試しください。"),
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
