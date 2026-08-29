"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/lib/supabase/actions";

const initialState: AuthActionState = { error: null };

export function ResetPasswordRequestForm({
  linkExpired = false,
}: {
  linkExpired?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
        <p className="text-sm leading-relaxed text-emerald-400">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {linkExpired ? (
        <p role="alert" className="text-sm text-red-400">
          リンクが無効か、有効期限が切れています。お手数ですが、もう一度お試しください。
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="you@example.com"
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
        className="mt-2 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "送信中…" : "再設定メールを送信"}
      </button>
    </form>
  );
}
