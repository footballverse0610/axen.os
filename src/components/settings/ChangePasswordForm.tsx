"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { changePassword, type AuthActionState } from "@/lib/supabase/actions";

const initialState: AuthActionState = { error: null };

function PasswordFields() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
        <p className="text-sm leading-relaxed text-emerald-400">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
          新しいパスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="6文字以上"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="passwordConfirm" className="text-xs font-medium text-muted-foreground">
          新しいパスワード（確認）
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="もう一度入力"
        />
        {passwordMismatch ? (
          <p className="text-xs text-red-400">パスワードが一致しません。</p>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || passwordMismatch}
        className="mt-2 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "更新中…" : "パスワードを更新"}
      </button>
    </form>
  );
}

/**
 * 「パスワードを変更」ボタン + モーダルの自己完結コンポーネント。
 * BusinessSwitcherと同じ「トリガーボタンと状態を1コンポーネントに閉じる」
 * パターンを踏襲している。
 */
export function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
      >
        パスワードを変更
      </button>

      {isOpen ? (
        <Modal title="パスワードを変更" onClose={() => setIsOpen(false)}>
          <PasswordFields />
        </Modal>
      ) : null}
    </>
  );
}
