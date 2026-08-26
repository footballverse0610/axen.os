"use client";

import { Send, Sparkles } from "lucide-react";
import { mockCoachConversation, suggestedPrompts } from "@/lib/mock-data";

export default function CoachPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <Sparkles className="h-5 w-5 text-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Business Coach</p>
          <p className="text-xs text-muted-foreground">近日公開予定の機能です</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {mockCoachConversation.map((message) => {
          const isCoach = message.role === "coach";
          return (
            <div
              key={message.id}
              className={`flex ${isCoach ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                  isCoach
                    ? "rounded-tl-sm border border-border bg-surface text-foreground"
                    : "rounded-tr-sm bg-foreground text-background"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <span
            key={prompt}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground"
          >
            {prompt}
          </span>
        ))}
      </div>

      <div className="sticky bottom-20 mt-2 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 md:bottom-4">
        <input
          type="text"
          disabled
          placeholder="AI機能は近日公開予定です"
          className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled
          aria-label="送信(近日公開)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
