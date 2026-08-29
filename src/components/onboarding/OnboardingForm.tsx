"use client";

import { useActionState, useEffect } from "react";
import {
  createBusiness,
  updateBusiness,
  type BusinessActionState,
} from "@/lib/supabase/actions";
import type { Business } from "@/lib/supabase/types";

const initialState: BusinessActionState = { error: null };

const STAGE_OPTIONS = [
  { value: "idea", label: "アイデア" },
  { value: "preparing", label: "準備中" },
  { value: "operating", label: "運営中" },
  { value: "paused", label: "一時停止" },
];

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

/**
 * 事業の作成(初回オンボーディング/2つ目以降の追加)と編集(現在選択中の事業のみ)
 * を1つのフォームで共用する。businessが渡されれば編集モード
 * (updateBusinessを使用、defaultValueを事業の現在値で埋める)、
 * 渡されなければ作成モード(createBusiness、既存の挙動のまま)。
 *
 * 編集モードではupdateBusinessがredirectせずstate.successを返すため、
 * onDoneでモーダルを閉じる(作成モードはredirectするため画面遷移で
 * モーダルごと消える。onDoneは呼ばれない)。
 */
export function OnboardingForm({
  business,
  submitLabel = "はじめる",
  onDone,
}: {
  business?: Business;
  submitLabel?: string;
  onDone?: () => void;
}) {
  const action = business ? updateBusiness : createBusiness;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (business && state.success) {
      onDone?.();
    }
  }, [business, state.success, onDone]);

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
          defaultValue={business?.name}
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
          defaultValue={business?.one_liner ?? ""}
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
          defaultValue={business?.industry ?? ""}
          className={fieldClass}
          placeholder="例：飲食、IT、教育"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="stage" className="text-xs font-medium text-muted-foreground">
          事業ステージ
        </label>
        <select
          id="stage"
          name="stage"
          defaultValue={business?.stage ?? "idea"}
          className={fieldClass}
        >
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
        {isPending ? (business ? "保存中…" : "作成中…") : submitLabel}
      </button>
    </form>
  );
}
