"use client";

import { Plus, Pencil, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { goalStatusLabel, goalStatusTone, goalTypeLabel } from "@/lib/goal-status";
import { calcGoalProgress } from "@/lib/supabase/finance";
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

  const activeGoals = goals.filter((g) => g.status === "active");
  const otherGoals = goals.filter((g) => g.status !== "active");

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
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = calcGoalProgress(goal.current_value, goal.target_value);
  const unit = goal.unit ?? "";

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

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {goal.current_value.toLocaleString("ja-JP")}
          {unit} / {goal.target_value.toLocaleString("ja-JP")}
          {unit}
        </span>
        {goal.target_date ? <span>期限: {goal.target_date}</span> : null}
      </div>

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
