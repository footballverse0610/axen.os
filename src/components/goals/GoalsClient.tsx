"use client";

import { Minus, Plus, Pencil, Target, Trash2 } from "lucide-react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { goalStatusLabel, goalStatusTone, goalTypeLabel } from "@/lib/goal-status";
import { calcGoalProgress, suggestGoalStep } from "@/lib/supabase/finance";
import { adjustGoalCurrentValue } from "@/lib/supabase/goal-actions";
import type { Goal } from "@/lib/supabase/types";
import { GoalForm } from "./GoalForm";
import { DeleteGoalModal } from "./DeleteGoalModal";

type ModalState =
  | { type: "create" }
  | { type: "edit"; goal: Goal }
  | { type: "delete"; goal: Goal }
  | null;

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  // +/-・直接入力での現在値変更を即座にUIへ反映するための楽観的更新。
  // 保存が失敗した場合はgoalsプロパティ(サーバーの実データ)が変わらないため、
  // Transition終了時に自動的に元の値へ戻る。
  const [optimisticGoals, applyOptimisticValue] = useOptimistic(
    goals,
    (state: Goal[], patch: { goalId: string; currentValue: number }) =>
      state.map((g) => (g.id === patch.goalId ? { ...g, current_value: patch.currentValue } : g)),
  );

  const activeGoals = optimisticGoals.filter((g) => g.status === "active");
  const otherGoals = optimisticGoals.filter((g) => g.status !== "active");

  if (goals.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
            <Target className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">まだ目標がありません</p>
          <p className="text-sm text-muted-foreground">
            最初の目標を設定してみよう。
          </p>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            目標を追加
          </button>
        </div>

        {modal?.type === "create" ? (
          <Modal title="目標を追加" onClose={() => setModal(null)}>
            <GoalForm onDone={() => setModal(null)} />
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          事業の目標と進捗を管理します。
        </p>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          追加
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          進行中 ({activeGoals.length})
        </h2>
        <div className="flex flex-col gap-3">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              applyOptimisticValue={applyOptimisticValue}
              onEdit={() => setModal({ type: "edit", goal })}
              onDelete={() => setModal({ type: "delete", goal })}
            />
          ))}
          {activeGoals.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              進行中の目標はありません。
            </Card>
          ) : null}
        </div>
      </section>

      {otherGoals.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            終了した目標 ({otherGoals.length})
          </h2>
          <div className="flex flex-col gap-3">
            {otherGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                applyOptimisticValue={applyOptimisticValue}
                onEdit={() => setModal({ type: "edit", goal })}
                onDelete={() => setModal({ type: "delete", goal })}
              />
            ))}
          </div>
        </section>
      ) : null}

      {modal?.type === "create" ? (
        <Modal title="目標を追加" onClose={() => setModal(null)}>
          <GoalForm onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "edit" ? (
        <Modal title="目標を編集" onClose={() => setModal(null)}>
          <GoalForm goal={modal.goal} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteGoalModal goal={modal.goal} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

function GoalCard({
  goal,
  applyOptimisticValue,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  applyOptimisticValue: (patch: { goalId: string; currentValue: number }) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [draftValue, setDraftValue] = useState(String(goal.current_value));
  const [valueError, setValueError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = calcGoalProgress(goal.current_value, goal.target_value);
  const unit = goal.unit ?? "";
  const step = suggestGoalStep(goal.target_value);
  const isLinked = goal.goal_type !== "custom";

  function commitValue(newValue: number) {
    if (!Number.isFinite(newValue) || newValue < 0) {
      setValueError("0以上の数値を入力してください。");
      return;
    }
    setValueError(null);
    startTransition(async () => {
      applyOptimisticValue({ goalId: goal.id, currentValue: newValue });
      const result = await adjustGoalCurrentValue(goal.id, newValue);
      if (result.error) {
        setValueError(result.error);
      }
    });
  }

  function handleStep(delta: number) {
    commitValue(Math.max(0, goal.current_value + delta));
  }

  function openValueEditor() {
    setDraftValue(String(goal.current_value));
    setValueError(null);
    setIsEditingValue(true);
  }

  function submitValueEditor() {
    const parsed = Number(draftValue);
    setIsEditingValue(false);
    if (draftValue.trim() === "" || Number.isNaN(parsed)) {
      setValueError("数値を入力してください。");
      return;
    }
    commitValue(parsed);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{goal.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{goalTypeLabel[goal.goal_type]}</p>
        </div>
        <Badge tone={goalStatusTone[goal.status]}>{goalStatusLabel[goal.status]}</Badge>
      </div>

      {goal.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{goal.description}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Bar value={progress} max={100} tone={progress >= 100 ? "good" : "neutral"} />
        <span className="shrink-0 text-xs font-medium text-foreground">{progress}%</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-step)}
          disabled={isPending || goal.current_value <= 0}
          aria-label={`現在値を${step.toLocaleString("ja-JP")}減らす`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>

        {isEditingValue ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            autoFocus
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={submitValueEditor}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitValueEditor();
              }
              if (e.key === "Escape") {
                setIsEditingValue(false);
              }
            }}
            className="w-28 rounded-lg border border-foreground/30 bg-surface-muted px-2 py-1 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        ) : (
          <button
            type="button"
            onClick={openValueEditor}
            disabled={isPending}
            className="min-w-0 rounded-lg px-2 py-1 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {goal.current_value.toLocaleString("ja-JP")}
            {unit}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleStep(step)}
          disabled={isPending}
          aria-label={`現在値を${step.toLocaleString("ja-JP")}増やす`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>目標: {goal.target_value.toLocaleString("ja-JP")}{unit}</span>
        {goal.target_date ? <span>期限: {goal.target_date}</span> : null}
      </div>

      {isLinked ? (
        <p className="text-[11px] text-muted-foreground">
          Financeの実績と自動連携中(手動で調整しても、次の売上・経費の登録時に実績値へ再計算されます)
        </p>
      ) : null}

      {valueError ? (
        <p role="alert" className="text-xs text-red-400">
          {valueError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label="編集"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="削除"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </Card>
  );
}
