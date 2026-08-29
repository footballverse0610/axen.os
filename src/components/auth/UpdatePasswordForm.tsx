"use client";

import { useActionState, useState } from "react";
import { updatePassword, type AuthActionState } from "@/lib/supabase/actions";

const initialState: AuthActionState = { error: null };

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

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
