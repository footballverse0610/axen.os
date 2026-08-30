"use client";

import { useActionState, useEffect } from "react";
import { createTask, updateTask, type TaskActionState } from "@/lib/supabase/task-actions";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { DEFAULT_TASK_CATEGORY, TASK_CATEGORY_SUGGESTIONS } from "@/lib/task-categories";
import type { Task } from "@/lib/supabase/types";

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "HIGH" },
  { value: "MEDIUM", label: "MEDIUM" },
  { value: "LOW", label: "LOW" },
];

const initialState: TaskActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

export function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const action = task ? updateTask : createTask;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}

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
          defaultValue={task?.title}
          className={fieldClass}
          placeholder="例：競合3社の価格リサーチ"
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
          defaultValue={task?.description ?? ""}
          className={fieldClass}
          placeholder="詳細があれば"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-xs font-medium text-muted-foreground">
          優先度
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={task?.priority ?? "MEDIUM"}
          className={fieldClass}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
          カテゴリー
        </label>
        <CategoryPicker
          id="category"
          name="category"
          defaultValue={task?.category ?? DEFAULT_TASK_CATEGORY}
          suggestions={TASK_CATEGORY_SUGGESTIONS}
          placeholder="例：マーケティング"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dueDate" className="text-xs font-medium text-muted-foreground">
          期限
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={task?.due_date ?? ""}
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
        {isPending ? "保存中…" : task ? "変更を保存" : "タスクを追加"}
      </button>
    </form>
  );
}
