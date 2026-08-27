"use client";

import { useActionState, useEffect } from "react";
import { createIdea, updateIdea, type IdeaActionState } from "@/lib/supabase/idea-actions";
import type { BusinessIdea } from "@/lib/supabase/types";

const STAGE_OPTIONS = [
  { value: "draft", label: "アイデア" },
  { value: "validating", label: "検証中" },
  { value: "building", label: "構築中" },
  { value: "launched", label: "ローンチ済み" },
];

const initialState: IdeaActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

export function IdeaForm({
  idea,
  onDone,
}: {
  idea?: BusinessIdea;
  onDone: () => void;
}) {
  const action = idea ? updateIdea : createIdea;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {idea ? <input type="hidden" name="ideaId" value={idea.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
          タイトル <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={idea?.title}
          className={fieldClass}
          placeholder="例：サブスク型パーソナル栄養コーチ"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={idea?.description ?? ""}
          className={fieldClass}
          placeholder="どんなアイデアか一言で"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="stage" className="text-xs font-medium text-muted-foreground">
          ステージ
        </label>
        <select
          id="stage"
          name="stage"
          defaultValue={idea?.stage ?? "draft"}
          className={fieldClass}
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="potentialScore" className="text-xs font-medium text-muted-foreground">
          ポテンシャルスコア（0〜100）
        </label>
        <input
          id="potentialScore"
          name="potentialScore"
          type="number"
          min={0}
          max={100}
          step={1}
          required
          defaultValue={idea?.potential_score ?? 50}
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "保存中…" : idea ? "変更を保存" : "アイデアを追加"}
      </button>
    </form>
  );
}
