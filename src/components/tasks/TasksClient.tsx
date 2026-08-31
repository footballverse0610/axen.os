"use client";

import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { priorityLabel, priorityOrder } from "@/lib/task-priority";
import { calcDueUrgency, dueUrgencyLabel, dueUrgencyTone } from "@/lib/task-due";
import { toggleTaskDone } from "@/lib/supabase/task-actions";
import type { Task } from "@/lib/supabase/types";
import { TaskForm } from "./TaskForm";
import { DeleteTaskModal } from "./DeleteTaskModal";

type ModalState =
  | { type: "create" }
  | { type: "edit"; task: Task }
  | { type: "delete"; task: Task }
  | null;

/**
 * 未完了Taskの基本ソート順: 1.優先度が高い順 2.期限が近い順
 * 3.期限なしは最後。既存のDB側ソート(due_date昇順)を尊重しつつ、
 * 優先度を最優先の軸として追加する(クライアント側でのみ並べ替え、
 * 取得クエリ・business_id分離には手を加えない)。
 */
function compareOpenTasks(a: Task, b: Task): number {
  const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  if (priorityDiff !== 0) return priorityDiff;
  if (a.due_date && b.due_date) {
    return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
  }
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return 0;
}

export function TasksClient({ tasks }: { tasks: Task[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  // チェックを押した瞬間にUIへ反映するための楽観的更新。サーバーへの保存が
  // 完了(revalidatePath)する前に完了状態を切り替える。保存が失敗した場合は
  // tasksプロパティ(サーバーの実データ)が変わらないため、Transition終了時に
  // 自動的に元の状態へ戻る。
  const [optimisticTasks, applyOptimisticToggle] = useOptimistic(
    tasks,
    (state: Task[], patch: { taskId: string; done: boolean }) =>
      state.map((t) =>
        t.id === patch.taskId
          ? { ...t, done: patch.done, completed_at: patch.done ? new Date().toISOString() : null }
          : t,
      ),
  );

  const openTasks = optimisticTasks.filter((t) => !t.done).sort(compareOpenTasks);
  const doneTasks = optimisticTasks.filter((t) => t.done);

  // 優先度ごとにグループ化する(未完了のみ。完了済みは通常のリストのまま)。
  const openByPriority = priorityOrder
    .map((priority) => ({
      priority,
      tasks: openTasks.filter((t) => t.priority === priority),
    }))
    .filter((group) => group.tasks.length > 0);

  if (tasks.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
            <ListChecks className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">まだタスクがありません</p>
          <p className="text-sm text-muted-foreground">
            最初のタスクを追加してみよう。
          </p>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            タスクを追加
          </button>
        </div>

        {modal?.type === "create" ? (
          <Modal title="タスクを追加" onClose={() => setModal(null)}>
            <TaskForm onDone={() => setModal(null)} />
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          事業運営に必要なタスクを一元管理します。
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
          未完了 ({openTasks.length})
        </h2>
        {openTasks.length === 0 ? (
          <Card className="text-sm text-muted-foreground">
            未完了のタスクはありません。
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {openByPriority.map((group) => (
              <div key={group.priority}>
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      group.priority === "HIGH"
                        ? "bg-red-400"
                        : group.priority === "MEDIUM"
                          ? "bg-amber-400"
                          : "bg-muted-foreground"
                    }`}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {priorityLabel[group.priority]} ({group.tasks.length})
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      applyOptimisticToggle={applyOptimisticToggle}
                      onEdit={() => setModal({ type: "edit", task })}
                      onDelete={() => setModal({ type: "delete", task })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {doneTasks.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            完了済み ({doneTasks.length})
          </h2>
          <div className="flex flex-col gap-2">
            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                applyOptimisticToggle={applyOptimisticToggle}
                onEdit={() => setModal({ type: "edit", task })}
                onDelete={() => setModal({ type: "delete", task })}
              />
            ))}
          </div>
        </section>
      ) : null}

      {modal?.type === "create" ? (
        <Modal title="タスクを追加" onClose={() => setModal(null)}>
          <TaskForm onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "edit" ? (
        <Modal title="タスクを編集" onClose={() => setModal(null)}>
          <TaskForm task={modal.task} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteTaskModal task={modal.task} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  applyOptimisticToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  applyOptimisticToggle: (patch: { taskId: string; done: boolean }) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const urgency = calcDueUrgency(task.due_date);
  const urgencyText = dueUrgencyLabel[urgency];

  function handleToggle() {
    setToggleError(null);
    const nextDone = !task.done;
    startTransition(async () => {
      applyOptimisticToggle({ taskId: task.id, done: nextDone });
      const result = await toggleTaskDone(task.id, nextDone);
      if (result.error) {
        setToggleError(result.error);
      }
    });
  }

  return (
    <Card className={`flex items-start gap-3 py-3 ${task.done ? "opacity-60" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `${task.title} を未完了にする` : `${task.title} を完了にする`}
        onClick={handleToggle}
        disabled={isPending}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60 ${
          task.done
            ? "border-emerald-400 bg-emerald-400/20"
            : "border-border bg-transparent"
        }`}
      >
        {task.done ? (
          <span className="h-2 w-2 rounded-sm bg-emerald-400" aria-hidden />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            task.done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!task.done && urgencyText ? (
            <Badge tone={dueUrgencyTone[urgency]}>{urgencyText}</Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">{task.category}</span>
          {task.due_date ? (
            <span className="text-xs text-muted-foreground">期限: {task.due_date}</span>
          ) : null}
        </div>
        {toggleError ? (
          <p role="alert" className="mt-1.5 text-xs text-red-400">
            {toggleError}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
