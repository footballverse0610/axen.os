"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteTransaction } from "@/lib/supabase/finance-actions";
import type { FinanceEntry } from "./FinanceClient";

export function DeleteTransactionModal({
  entry,
  onClose,
}: {
  entry: FinanceEntry;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransaction(entry.kind, entry.data.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={entry.kind === "sale" ? "売上を削除" : "経費を削除"} onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        「{entry.data.label}」を削除します。この操作は取り消せません。
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
