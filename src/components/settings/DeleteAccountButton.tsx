"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "@/components/ui/Modal";
import { deleteAccount } from "@/lib/supabase/actions";

/** 送信開始と同時にボタンを無効化し、連打による多重送信を防ぐ。 */
function DeleteSubmitButton({ confirmed }: { confirmed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!confirmed || pending}
      className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {pending ? "削除中…" : "削除する"}
    </button>
  );
}

function ConfirmDeleteForm({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={deleteAccount} className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-foreground">
        アカウントを削除すると、プロフィール・事業・アイデア・タスク・目標・売上/経費の記録・AI
        Coachとの会話履歴を含む、すべてのデータが完全に削除されます。この操作は取り消せません。
      </p>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        内容を理解した上で、アカウントを削除します。
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        >
          キャンセル
        </button>
        <DeleteSubmitButton confirmed={confirmed} />
      </div>
    </form>
  );
}

/**
 * 「アカウントを削除」ボタン + Modalの自己完結コンポーネント。
 * ChangePasswordFormと同じ「トリガーボタンと状態を1コンポーネントに閉じる」
 * パターンを踏襲している。
 */
export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-red-500/30 bg-transparent px-3.5 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
      >
        アカウントを削除
      </button>

      {isOpen ? (
        <Modal title="アカウントを削除" onClose={() => setIsOpen(false)}>
          <ConfirmDeleteForm onClose={() => setIsOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}
