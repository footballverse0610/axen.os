"use client";

import { useActionState } from "react";
import { createBusiness, type BusinessActionState } from "@/lib/supabase/actions";

const initialState: BusinessActionState = { error: null };

const STAGE_OPTIONS = [
  { value: "idea", label: "アイデア" },
  { value: "preparing", label: "準備中" },
  { value: "operating", label: "運営中" },
  { value: "paused", label: "一時停止" },
];

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

export function OnboardingForm({ submitLabel = "はじめる" }: { submitLabel?: string }) {
  const [state, formAction, isPending] = useActionState(createBusiness, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
          事業名 <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className={fieldClass}
          placeholder="例：起業しよ。"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="oneLiner" className="text-xs font-medium text-muted-foreground">
          どんな事業？
        </label>
        <textarea
          id="oneLiner"
          name="oneLiner"
          maxLength={200}
          rows={3}
          className={fieldClass}
          placeholder="一言で説明すると？"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="industry" className="text-xs font-medium text-muted-foreground">
          業種
        </label>
        <input
          id="industry"
          name="industry"
          type="text"
          maxLength={50}
          className={fieldClass}
          placeholder="例：飲食、IT、教育"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="stage" className="text-xs font-medium text-muted-foreground">
          事業ステージ
        </label>
        <select id="stage" name="stage" defaultValue="idea" className={fieldClass}>
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "作成中…" : submitLabel}
      </button>
    </form>
  );
}
