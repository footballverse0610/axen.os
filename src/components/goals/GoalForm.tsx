"use client";

import { useActionState, useEffect } from "react";
import { createGoal, updateGoal, type GoalActionState } from "@/lib/supabase/goal-actions";
import { goalStatusLabel, goalTypeLabel } from "@/lib/goal-status";
import type { Goal, GoalStatus, GoalType } from "@/lib/supabase/types";

const GOAL_TYPE_OPTIONS: GoalType[] = ["revenue", "profit", "sales_count", "custom"];
const GOAL_STATUS_OPTIONS: GoalStatus[] = ["active", "achieved", "missed", "paused"];

const initialState: GoalActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const action = goal ? updateGoal : createGoal;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {goal ? <input type="hidden" name="goalId" value={goal.id} /> : null}

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
          defaultValue={goal?.title}
          className={fieldClass}
          placeholder="例：月商10万円を達成する"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={goal?.description ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="goalType" className="text-xs font-medium text-muted-foreground">
            種類
          </label>
          <select
            id="goalType"
            name="goalType"
            defaultValue={goal?.goal_type ?? "revenue"}
            className={fieldClass}
          >
            {GOAL_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {goalTypeLabel[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            ステータス
          </label>
          <select
            id="status"
            name="status"
            defaultValue={goal?.status ?? "active"}
            className={fieldClass}
          >
            {GOAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {goalStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="targetValue" className="text-xs font-medium text-muted-foreground">
            目標値 <span className="text-red-400">*</span>
          </label>
          <input
            id="targetValue"
            name="targetValue"
            type="number"
            min={1}
            step="any"
            required
            defaultValue={goal?.target_value}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentValue" className="text-xs font-medium text-muted-foreground">
            現在値
          </label>
          <input
            id="currentValue"
            name="currentValue"
            type="number"
            min={0}
            step="any"
            defaultValue={goal?.current_value ?? 0}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="unit" className="text-xs font-medium text-muted-foreground">
          単位
        </label>
        <input
          id="unit"
          name="unit"
          type="text"
          maxLength={20}
          defaultValue={goal?.unit ?? ""}
          className={fieldClass}
          placeholder="例：円、件"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-xs font-medium text-muted-foreground">
            開始日 <span className="text-red-400">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={goal?.start_date ?? today()}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="targetDate" className="text-xs font-medium text-muted-foreground">
            期限
          </label>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            defaultValue={goal?.target_date ?? ""}
            className={fieldClass}
          />
        </div>
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
        {isPending ? "保存中…" : goal ? "変更を保存" : "目標を追加"}
      </button>
    </form>
  );
}
