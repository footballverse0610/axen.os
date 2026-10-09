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

  const hasPillActions = actions.tasks.length > 0 || actions.goals.length > 0;

  return (
    <div className="mt-2 flex flex-col gap-3">
      {hasPillActions ? (
        <div className="flex flex-wrap gap-2">
          {actions.tasks.length > 0 ? <TaskSuggestions tasks={actions.tasks} /> : null}
          {actions.goals.map((goal, index) => (
            <SingleGoalButton key={index} goal={goal} />
          ))}
        </div>
      ) : null}
      {actions.ideas.length > 0 ? <IdeaSuggestions ideas={actions.ideas} /> : null}
    </div>
  );
}

type TaskSuggestionsModal = { type: "single"; index: number } | { type: "bulk" } | null;

/**
 * 複数のタスク提案を、個別追加・一括追加の両方で扱うコンポーネント。
 *
 * タスクごとの追加済み状態(statuses)を1つの配列で共有管理することで、
 * 「個別で1件追加済みのタスクを、後から一括追加で再度登録してしまう」
 * といった重複登録を構造的に防ぐ(どちらの経路で追加しても、同じ
 * statuses配列が更新される)。
 *
 * モーダルはsingle/bulkのどちらか一方のみを1つのstateで管理する
 * (既存のTasksClient等と同じ、同時に複数モーダルを開かせない設計)。
 */
function TaskSuggestions({ tasks }: { tasks: CoachSuggestedTask[] }) {
  const [statuses, setStatuses] = useState<("idle" | "done")[]>(() => tasks.map(() => "idle"));
  const [modal, setModal] = useState<TaskSuggestionsModal>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  function markDone(index: number) {
    setStatuses((prev) => prev.map((status, i) => (i === index ? "done" : status)));
  }

  // 個別追加で既に完了したタスクは、一括追加の対象から自動的に除外される。
  const pendingIndexes = statuses
    .map((status, index) => ({ status, index }))
    .filter(({ status }) => status !== "done")
    .map(({ index }) => index);

  async function handleBulkConfirm() {
    if (bulkSubmitting) return;
    setBulkSubmitting(true);
    setBulkError(null);

    for (const index of pendingIndexes) {
      const task = tasks[index];
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
        // Server Actionが例外を投げた場合は成功とみなさない(statusesを進めない)。
        setBulkError("タスクの追加に失敗しました。時間をおいて再度お試しください。");
        setBulkSubmitting(false);
        return;
      }

      // 戻り値が成功を示した場合のみ、そのタスクを成功済みとして扱う。
      if (result.error) {
        setBulkError(result.error);
        setBulkSubmitting(false);
        return;
      }
      markDone(index);
    }

    setBulkSubmitting(false);
    setModal(null);
  }

  const bulkTargetIndexes = modal?.type === "bulk" ? pendingIndexes : [];

  return (
    <>
      {tasks.map((task, index) => {
        const isDone = statuses[index] === "done";
        return (
          <button
            key={index}
            type="button"
            onClick={() => setModal({ type: "single", index })}
            disabled={isDone || bulkSubmitting}
            className={`${primaryPillClass} ${isDone ? doneClass : primaryDefaultClass}`}
          >
            {isDone ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden />
                追加済み
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                このタスクを追加
              </>
            )}
          </button>
        );
      })}

      {/* 未追加が2件以上残っている場合のみ、まとめて追加ボタンを表示する。 */}
      {pendingIndexes.length > 1 ? (
        <button
          type="button"
          onClick={() => setModal({ type: "bulk" })}
          disabled={bulkSubmitting}
          className={`${primaryPillClass} ${secondaryDefaultClass}`}
        >
          🚀 残り{pendingIndexes.length}件をまとめて追加
        </button>
      ) : null}

      {modal?.type === "single" ? (
        <Modal title="タスクを追加" onClose={() => setModal(null)}>
          <TaskForm
            initialValues={{
              title: tasks[modal.index].title,
              description: tasks[modal.index].description ?? undefined,
              dueDate: tasks[modal.index].dueDate ?? undefined,
            }}
            onDone={() => {
              markDone(modal.index);
              setModal(null);
            }}
          />
        </Modal>
      ) : null}

      {modal?.type === "bulk" ? (
        <Modal title={`${bulkTargetIndexes.length}件のタスクを追加`} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {bulkTargetIndexes.map((index) => {
                const task = tasks[index];
                return (
                  <li
                    key={index}
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
                );
              })}
            </ul>

            {bulkError ? (
              <p role="alert" className="text-sm text-red-400">
                {bulkError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleBulkConfirm}
              disabled={bulkSubmitting}
              className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {bulkSubmitting ? "追加中…" : `この${bulkTargetIndexes.length}件を追加する`}
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

const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

/**
 * 複数のアイデア提案を、カードごとに「タイトル・説明・保存ボタン」をまとめて
 * 表示するコンポーネント。どのボタンがどのアイデアに対応するかが一目で
 * 分かるようにする(タイトルのみのボタンが並ぶと対応関係が分かりにくい、
 * という指摘への対応)。
 *
 * 各カードはidea配列のインデックスに閉じたローカルstate(open/done)を
 * 持つだけなので、保存の成否・処理中表示は常にそのアイデア自身にのみ反映され、
 * 他のカードに影響しない。
 */
function IdeaSuggestions({ ideas }: { ideas: CoachSuggestedIdea[] }) {
  return (
    <div className="flex flex-col gap-2">
      {ideas.map((idea, index) => (
        <IdeaSuggestionCard key={index} idea={idea} index={index} total={ideas.length} />
      ))}
    </div>
  );
}

function IdeaSuggestionCard({
  idea,
  index,
  total,
}: {
  idea: CoachSuggestedIdea;
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3.5 py-3">
      {total > 1 ? (
        <p className="text-[11px] font-medium text-muted-foreground">
          アイデア{circledNumbers[index] ?? `(${index + 1})`}
        </p>
      ) : null}
      <p className="mt-0.5 text-sm font-semibold text-foreground">{idea.title}</p>
      {idea.description ? (
        <p className="mt-1 text-xs text-muted-foreground">{idea.description}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className={`${primaryPillClass} mt-2.5 ${done ? doneClass : primaryDefaultClass}`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            保存済み
          </>
        ) : (
          <>💡 このアイデアを保存</>
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
    </div>
  );
}
