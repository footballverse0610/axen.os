"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { GoalForm } from "@/components/goals/GoalForm";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { createTask } from "@/lib/supabase/task-actions";
import type {
  CoachActions,
  CoachSuggestedGoal,
  CoachSuggestedIdea,
  CoachSuggestedTask,
} from "@/lib/coach/actions-schema";

const primaryPillClass =
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed";
const primaryDefaultClass = "bg-primary text-white hover:opacity-90 disabled:opacity-60";
const secondaryDefaultClass =
  "border border-border bg-surface-muted text-foreground hover:bg-surface disabled:opacity-60";
const doneClass = "border border-green-500/40 bg-green-500/10 text-green-400";

/**
 * AIコーチの回答に付く「ワンタップ追加」ボタン群。
 * actionsが空(タスク・目標・アイデアいずれも提案なし)の場合は何も表示しない
 * (通常の会話の邪魔をしないという方針)。
 *
 * 実際のDB書き込みは既存のcreateTask/createGoal/createIdea(Server Action)を
 * そのまま呼ぶだけで、新しい書き込み経路・検証ロジックは追加していない。
 * AIが提案した内容はあくまでフォームの初期値であり、ユーザーが確認(必要なら
 * 編集)した上で、既存のフォーム送信と全く同じ経路で保存される。
 */
export function ActionSuggestions({ actions }: { actions: CoachActions }) {
  const hasContent =
    actions.tasks.length > 0 || actions.goals.length > 0 || actions.ideas.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.tasks.length === 1 ? (
        <SingleTaskButton task={actions.tasks[0]} />
      ) : actions.tasks.length > 1 ? (
        <BulkTasksButton tasks={actions.tasks} />
      ) : null}
      {actions.goals.map((goal, index) => (
        <SingleGoalButton key={index} goal={goal} />
      ))}
      {actions.ideas.map((idea, index) => (
        <SingleIdeaButton key={index} idea={idea} />
      ))}
    </div>
  );
}

function SingleTaskButton({ task }: { task: CoachSuggestedTask }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className={`${primaryPillClass} ${done ? doneClass : primaryDefaultClass}`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            タスクに追加しました
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            タスクに追加
          </>
        )}
      </button>

      {open ? (
        <Modal title="タスクを追加" onClose={() => setOpen(false)}>
          <TaskForm
            initialValues={{
              title: task.title,
              description: task.description ?? undefined,
              dueDate: task.dueDate ?? undefined,
            }}
            onDone={() => {
              setOpen(false);
              setDone(true);
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}

function BulkTasksButton({ tasks }: { tasks: CoachSuggestedTask[] }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 登録に成功したタスクの件数(先頭からtasks[0..completedCount-1]が成功済み)。
  // 一部失敗した後の再試行は、ここから再開する(成功済み分は作り直さない)。
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const remainingCount = tasks.length - completedCount;

  async function handleConfirm() {
    if (isSubmitting || completedCount >= tasks.length) return;
    setIsSubmitting(true);
    setError(null);

    for (let i = completedCount; i < tasks.length; i++) {
      const task = tasks[i];
      const formData = new FormData();
      formData.set("title", task.title);
      formData.set("description", task.description ?? "");
      formData.set("priority", "MEDIUM");
      formData.set("category", "");
      formData.set("dueDate", task.dueDate ?? "");

      let result: { error: string | null } | undefined;
      try {
        result = await createTask({ error: null }, formData);
      } catch {
        // Server Actionが例外を投げた場合は成功とみなさない(completedCountを進めない)。
        setError(
          `タスクの追加に失敗しました。${i}件は追加済みです(残り${tasks.length - i}件)。時間をおいて再度お試しください。`,
        );
        setIsSubmitting(false);
        return;
      }

      // 戻り値が成功を示した場合のみ、そのタスクを成功済みとして扱う。
      if (result.error) {
        setError(`${result.error}(${i}件は追加済みです。残り${tasks.length - i}件)`);
        setCompletedCount(i);
        setIsSubmitting(false);
        return;
      }
      setCompletedCount(i + 1);
    }

    setIsSubmitting(false);
    setDone(true);
    setOpen(false);
  }

  const remainingTasks = tasks.slice(completedCount);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className={`${primaryPillClass} ${done ? doneClass : primaryDefaultClass}`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            {tasks.length}件追加しました
          </>
        ) : completedCount > 0 ? (
          <>🚀 残り{remainingCount}件をタスクに追加</>
        ) : (
          <>🚀 {tasks.length}件まとめてタスクに追加</>
        )}
      </button>

      {open ? (
        <Modal
          title={
            completedCount > 0
              ? `残り${remainingCount}件のタスクを追加`
              : `${tasks.length}件のタスクを追加`
          }
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-col gap-3">
            {completedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                すでに{completedCount}件追加済みです。残り{remainingCount}件を追加します。
              </p>
            ) : null}

            <ul className="flex flex-col gap-2">
              {remainingTasks.map((task, index) => (
                <li
                  key={completedCount + index}
                  className="rounded-xl border border-border bg-surface-muted px-3.5 py-3"
                >
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  {task.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                  ) : null}
                  {task.dueDate ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      期限: {task.dueDate}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {error ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "追加中…" : `この${remainingCount}件を追加する`}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function SingleGoalButton({ goal }: { goal: CoachSuggestedGoal }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className={`${primaryPillClass} ${done ? doneClass : secondaryDefaultClass}`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            目標を設定しました
          </>
        ) : (
          <>🎯 この目標を設定</>
        )}
      </button>

      {open ? (
        <Modal title="目標を設定" onClose={() => setOpen(false)}>
          <GoalForm
            initialValues={{
              title: goal.title,
              description: goal.description ?? undefined,
              goalType: "custom",
              targetValue: goal.targetValue,
              unit: goal.unit ?? undefined,
              targetDate: goal.targetDate ?? undefined,
            }}
            onDone={() => {
              setOpen(false);
              setDone(true);
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}

function SingleIdeaButton({ idea }: { idea: CoachSuggestedIdea }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className={`${primaryPillClass} ${done ? doneClass : secondaryDefaultClass}`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            アイデアを保存しました
          </>
        ) : (
          <>💡 アイデアとして保存</>
        )}
      </button>

      {open ? (
        <Modal title="アイデアを保存" onClose={() => setOpen(false)}>
          <IdeaForm
            initialValues={{
              title: idea.title,
              description: idea.description ?? undefined,
            }}
            onDone={() => {
              setOpen(false);
              setDone(true);
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
