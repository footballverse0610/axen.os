"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteBusiness } from "@/lib/supabase/business-actions";
import type { Business } from "@/lib/supabase/types";

/**
 * 事業削除の確認モーダル。誤操作防止のため、事業名を正確に入力しないと
 * 削除ボタンが有効化されない。この一致チェックはUX用のクライアント側判定に
 * すぎず、実際のセキュリティ上のゲートはdeleteBusiness側のサーバー再検証
 * (confirmName === business.name)とRLS。
 */
export function DeleteBusinessModal({
  business,
  onClose,
  onDeleted,
}: {
  business: Business;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmName, setConfirmName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isMatch = confirmName === business.name;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteBusiness(confirmName);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <Modal title="事業を削除" onClose={onClose}>
      <p className="text-sm leading-relaxed text-red-400">
        「{business.name}」を削除すると、この事業に紐づくアイデア・タスク・目標・売上・経費・AI
        Coachの会話履歴もすべて完全に削除されます。この操作は取り消せません。
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="confirmName" className="text-xs font-medium text-muted-foreground">
          削除するには、事業名「{business.name}」を正確に入力してください
        </label>
        <input
          id="confirmName"
          type="text"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          autoComplete="off"
          className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30"
          placeholder={business.name}
        />
      </div>

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
          disabled={!isMatch || isPending}
          className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-red-500/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "削除中…" : "完全に削除する"}
        </button>
      </div>
    </Modal>
  );
}
