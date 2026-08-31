"use client";

import { useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { suggestedPrompts } from "@/lib/mock-data";
import type { CoachMessage } from "@/lib/supabase/types";

/** stateを持つ側でのみ使う型。propsを増やしすぎないよう最小限にする。 */
interface CoachChatProps {
  initialMessages: CoachMessage[];
  /** start-guide等から遷移した際に、入力欄へあらかじめ入れておく文章(自動送信はしない)。 */
  initialInput?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
}

function toChatMessage(message: CoachMessage): ChatMessage {
  return { id: message.id, role: message.role, content: message.content };
}

export function CoachChat({ initialMessages, initialInput }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map(toChatMessage),
  );
  const [input, setInput] = useState(initialInput ?? "");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === coachMessageId ? { ...m, content: m.content + chunk } : m,
          ),
        );
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <Sparkles className="h-5 w-5 text-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Business Coach</p>
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
              className={`flex ${isCoach ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                  isCoach
                    ? "rounded-tl-sm border border-border bg-surface text-foreground"
                    : "rounded-tr-sm bg-foreground text-background"
                }`}
              >
                {isEmptyPending ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  </span>
                ) : (
                  message.content
                )}
              </div>
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
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-20 mt-2 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 md:bottom-4"
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
