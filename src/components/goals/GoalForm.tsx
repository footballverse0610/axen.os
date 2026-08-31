"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { createGoal, updateGoal, type GoalActionState } from "@/lib/supabase/goal-actions";
import { MANUAL_GOAL_STATUS_OPTIONS, goalStatusLabel, goalTypeLabel } from "@/lib/goal-status";
import { formatJapaneseNumber, parseJapaneseNumber } from "@/lib/japanese-number";
import type { Goal, GoalType } from "@/lib/supabase/types";

const GOAL_TYPE_OPTIONS: GoalType[] = ["revenue", "profit", "sales_count", "custom"];

const initialState: GoalActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const action = goal ? updateGoal : createGoal;
  const [state, formAction, isPending] = useActionState(action, initialState);
  // 現在値が目標値以上の場合は自動的に「達成」表示になり、ステータスを
  // 手動選択できない(達成条件を下回れば、保存されている値へ自動的に戻る)。
  const isAchieved = goal ? goal.current_value >= goal.target_value : false;

  // 目標値・現在値は「10000」のようなプレーンな数値に加え、「1万」「1.5億」の
  // ような日本語表記でも入力できるようにする。入力欄自体はtype="text"にし、
  // 変換後のプレーンな数値をhidden inputでtargetValue/currentValueとして
  // 送信する(goal-actions.ts側の受け取り方は一切変更しない)。
  const [targetText, setTargetText] = useState(goal ? String(goal.target_value) : "");
  const [currentText, setCurrentText] = useState(goal ? String(goal.current_value) : "0");
  const [valueFormError, setValueFormError] = useState<string | null>(null);

  const targetParsed = parseJapaneseNumber(targetText);
  const currentParsed = currentText.trim() === "" ? 0 : parseJapaneseNumber(currentText);

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (targetText.trim() === "" || targetParsed === null || targetParsed <= 0) {
      e.preventDefault();
      setValueFormError(
        "目標値は「10000」や「1万」のように、0より大きい数値の形式で入力してください。",
      );
      return;
    }
    if (currentParsed === null || currentParsed < 0) {
      e.preventDefault();
      setValueFormError(
        "現在値は「5000」や「1.5万」のように、0以上の数値の形式で入力してください。",
      );
      return;
    }
    setValueFormError(null);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {isAchieved ? (
            <>
              {/* 達成条件を満たしている間は手動変更できない。保存されている
                  ステータスはそのまま維持し(達成条件を下回れば自動的に
                  その表示へ戻る)、hidden inputでそのまま送信する。 */}
              <input type="hidden" name="status" value={goal?.status} />
              <p
                className={`${fieldClass} flex items-center text-muted-foreground`}
                aria-live="polite"
              >
                達成(自動判定)
              </p>
            </>
          ) : (
            <select
              id="status"
              name="status"
              defaultValue={goal?.status ?? "active"}
              className={fieldClass}
            >
              {MANUAL_GOAL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {goalStatusLabel[s]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="targetValue" className="text-xs font-medium text-muted-foreground">
            目標値 <span className="text-red-400">*</span>
          </label>
          <input
            id="targetValue"
            type="text"
            inputMode="decimal"
            required
            value={targetText}
            onChange={(e) => {
              setTargetText(e.target.value);
              setValueFormError(null);
            }}
            placeholder="例：10000 や 1万"
            className={fieldClass}
          />
          <input type="hidden" name="targetValue" value={targetParsed !== null ? String(targetParsed) : ""} />
          {targetText.trim() !== "" && targetParsed !== null ? (
            <p className="text-[11px] text-muted-foreground">
              {targetParsed.toLocaleString("ja-JP")}({formatJapaneseNumber(targetParsed)})として入力されます
            </p>
          ) : null}
          {targetText.trim() !== "" && targetParsed === null ? (
            <p role="alert" className="text-[11px] text-red-400">
              数値、または「1万」「1.5億」のような形式で入力してください。
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentValue" className="text-xs font-medium text-muted-foreground">
            現在値
          </label>
          <input
            id="currentValue"
            type="text"
            inputMode="decimal"
            value={currentText}
            onChange={(e) => {
              setCurrentText(e.target.value);
              setValueFormError(null);
            }}
            placeholder="例：5000 や 1.5万"
            className={fieldClass}
          />
          <input type="hidden" name="currentValue" value={currentParsed !== null ? String(currentParsed) : ""} />
          {currentText.trim() !== "" && currentParsed !== null ? (
            <p className="text-[11px] text-muted-foreground">
              {currentParsed.toLocaleString("ja-JP")}({formatJapaneseNumber(currentParsed)})として入力されます
            </p>
          ) : null}
          {currentText.trim() !== "" && currentParsed === null ? (
            <p role="alert" className="text-[11px] text-red-400">
              数値、または「1万」「1.5億」のような形式で入力してください。
            </p>
          ) : null}
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

      {valueFormError ? (
        <p role="alert" className="text-sm text-red-400">
          {valueFormError}
        </p>
      ) : null}

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
