"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, Send } from "lucide-react";
import { suggestedPrompts } from "@/lib/mock-data";
import { ActionSuggestions } from "@/components/coach/ActionSuggestions";
import { CoachCharacterAvatar } from "@/components/coach/CoachCharacterAvatar";
import { resolveCoachCharacter } from "@/lib/coach/characters";
import {
  computeStreamingDisplayText,
  EMPTY_COACH_ACTIONS,
  sanitizeCoachActions,
  splitCoachStreamText,
  type CoachActions,
} from "@/lib/coach/actions-schema";
import type { CoachCharacterId, CoachMessage } from "@/lib/supabase/types";

/** stateを持つ側でのみ使う型。propsを増やしすぎないよう最小限にする。 */
interface CoachChatProps {
  initialMessages: CoachMessage[];
  /** start-guide等から遷移した際に、入力欄へあらかじめ入れておく文章(自動送信はしない)。 */
  initialInput?: string;
  /**
   * 選択中のAIコーチ。サーバー側(coach/page.tsx)で既に
   * resolveCoachCharacter()により有効な値へ解決済みのIDのみを渡す
   * (キャラクター定義のfallbackIconはReactコンポーネント参照のため、
   * Server ComponentからはこのIDのみを渡し、定義自体はこのコンポーネント内で
   * 解決する)。
   */
  coachCharacterId: CoachCharacterId;
}

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  /** coachロールのみ。ストリーミング完了後に末尾のマーカーから解析する(履歴の過去メッセージには付かない)。 */
  actions?: CoachActions;
}

function toChatMessage(message: CoachMessage): ChatMessage {
  return { id: message.id, role: message.role, content: message.content };
}

export function CoachChat({ initialMessages, initialInput, coachCharacterId }: CoachChatProps) {
  const character = resolveCoachCharacter(coachCharacterId);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map(toChatMessage),
  );
  const [input, setInput] = useState(initialInput ?? "");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  // チャット全体はこのページ自身(window)がスクロールする設計で、専用の
  // overflow-y-autoコンテナは持たない(既存のsticky入力欄と同じ前提)。
  // そのため「最下部にいるか」もwindowのスクロール位置から判定する。
  const [isAtBottom, setIsAtBottom] = useState(true);
  // ストリーミング中に毎チャンクで参照する値のため、再レンダーを待たず
  // 即時に読めるrefで持つ(setState由来のstateは次の描画まで古い値になる)。
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    // スクロール位置の多少のずれ(モバイルSafariのアドレスバー表示変化等)を
    // 許容するための閾値。0にすると数px残っただけでボタンが出てしまう。
    const BOTTOM_THRESHOLD_PX = 120;

    function updateIsAtBottom() {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - BOTTOM_THRESHOLD_PX;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }

    updateIsAtBottom();
    window.addEventListener("scroll", updateIsAtBottom, { passive: true });
    window.addEventListener("resize", updateIsAtBottom);
    return () => {
      window.removeEventListener("scroll", updateIsAtBottom);
      window.removeEventListener("resize", updateIsAtBottom);
    };
  }, []);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
    // プログラムによるスクロールの結果を待たずに「最下部にいる」ことを
    // 即時確定させる。ストリーミング中の追従判定(isAtBottomRef)に
    // すぐ反映させるため。
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setErrorMessage(null);
    setIsSending(true);
    setInput("");

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const coachMessageId = `local-coach-${Date.now()}`;
    setMessages((prev) => [...prev, userMessage, { id: coachMessageId, role: "coach", content: "" }]);
    // 送信は常にユーザー自身の操作なので、過去のメッセージを読んでいた
    // 場合でも、既存のチャットアプリと同様に最下部へ移動させる。
    scrollToBottom();

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok || !res.body) {
        let error = "送信に失敗しました。もう一度お試しください。";
        try {
          const data = await res.json();
          if (typeof data?.error === "string") error = data.error;
        } catch {
          // JSONで返らなかった場合はデフォルトのエラー文言を使う
        }
        setErrorMessage(error);
        setMessages((prev) => prev.filter((m) => m.id !== coachMessageId));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // 行動提案のマーカー以降は生テキストのまま画面に出さないよう、
      // 受信した全文(raw)と、実際に表示する文字列(displayText)を分けて持つ。
      let raw = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        // ストリーミング中はcomputeStreamingDisplayTextを使う。マーカーが複数の
        // チャンクに分割されて届いても、「マーカーかもしれない末尾」だけを
        // 一時的に保留し、通常の会話テキストの表示を欠落させない。
        const displayText = computeStreamingDisplayText(raw);
        setMessages((prev) =>
          prev.map((m) => (m.id === coachMessageId ? { ...m, content: displayText } : m)),
        );
        // ユーザーが最下部付近にいる場合のみ追従する。過去のメッセージを
        // 読んでいる途中であれば、ストリーミングで本文が伸びても
        // スクロール位置を勝手に動かさない。
        if (isAtBottomRef.current) {
          scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }

      const { displayText, actionsJson } = splitCoachStreamText(raw);
      let actions: CoachActions = EMPTY_COACH_ACTIONS;
      if (actionsJson) {
        try {
          actions = sanitizeCoachActions(JSON.parse(actionsJson));
        } catch {
          // 解析できない場合はボタンを出さないだけで、通常の会話表示は維持する
        }
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === coachMessageId ? { ...m, content: displayText, actions } : m)),
      );
    } catch {
      setErrorMessage("通信エラーが発生しました。もう一度お試しください。");
      setMessages((prev) => prev.filter((m) => m.id !== coachMessageId));
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <CoachCharacterAvatar characterId={character.id} size="md" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {character.name}（{character.typeLabel}）
          </p>
          <p className="text-xs text-muted-foreground">
            事業の状況を踏まえてアドバイスします(1日20メッセージまで)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
            気になることを気軽に相談してください。タスクの優先順位、価格設定、集客のアイデアなど、事業の状況を踏まえてお答えします。
          </div>
        ) : null}
        {messages.map((message) => {
          const isCoach = message.role === "coach";
          const isEmptyPending = isCoach && message.content.length === 0 && isSending;
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isCoach ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                  isCoach
                    ? "rounded-tl-sm border border-border bg-surface text-foreground"
                    : "rounded-tr-sm bg-primary text-white"
                }`}
              >
                {isEmptyPending ? (
                  <span className="inline-flex items-center gap-1 text-primary/70">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  </span>
                ) : (
                  message.content
                )}
              </div>
              {isCoach && message.actions ? (
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <ActionSuggestions actions={message.actions} />
                </div>
              ) : null}
            </div>
          );
        })}
        <div ref={scrollAnchorRef} />
      </div>

      {errorMessage ? (
        <p className="text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isSending}
            onClick={() => setInput(prompt)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {!isAtBottom ? (
        <div className="sticky bottom-36 z-10 flex justify-end md:bottom-20">
          <button
            type="button"
            onClick={() => scrollToBottom()}
            aria-label="最新のメッセージへ移動"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-surface-muted"
          >
            <ArrowDown className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-20 mt-2 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 transition-colors focus-within:border-primary/40 md:bottom-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          placeholder="コーチに相談する"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isSending || input.trim().length === 0}
          aria-label="送信"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
