"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteGoal } from "@/lib/supabase/goal-actions";
import type { Goal } from "@/lib/supabase/types";

export function DeleteGoalModal({
  goal,
  onClose,
}: {
  goal: Goal;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="目標を削除" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        「{goal.title}」を削除します。この操作は取り消せません。
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-red-500/90 disabled:opacity-60"
        >
          {isPending ? "削除中…" : "削除する"}
        </button>
      </div>
    </Modal>
  );
}
