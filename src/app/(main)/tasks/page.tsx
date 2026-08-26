"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { mockTasks } from "@/lib/mock-data";
import { priorityTone } from "@/lib/task-priority";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  };

  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          事業運営に必要なタスクを一元管理します。
        </p>
        <button
          type="button"
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
        <div className="flex flex-col gap-2">
          {openTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleTask} />
          ))}
          {openTasks.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              未完了のタスクはありません。
            </Card>
          ) : null}
        </div>
      </section>

      {doneTasks.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            完了済み ({doneTasks.length})
          </h2>
          <div className="flex flex-col gap-2">
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="flex items-start gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `${task.title} を未完了にする` : `${task.title} を完了にする`}
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
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
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          <span className="text-xs text-muted-foreground">{task.category}</span>
          {task.dueDate ? (
            <span className="text-xs text-muted-foreground">期限: {task.dueDate}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
