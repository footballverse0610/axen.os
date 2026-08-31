"use client";

import { useActionState, useState } from "react";
import {
  updateProfile,
  AVATAR_ICON_OPTIONS,
  type ProfileActionState,
} from "@/lib/supabase/profile-actions";
import type { Profile } from "@/lib/supabase/types";

const initialState: ProfileActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const [selectedIcon, setSelectedIcon] = useState(profile?.avatar_url ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-xs font-medium text-muted-foreground">
          表示名
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={30}
          defaultValue={profile?.display_name ?? ""}
          className={fieldClass}
          placeholder="例：たなか"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">アイコン</span>
        <input type="hidden" name="avatarIcon" value={selectedIcon} />
        <div className="flex flex-wrap gap-2">
          {AVATAR_ICON_OPTIONS.map((icon) => {
            const isSelected = selectedIcon === icon;
            return (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon((prev) => (prev === icon ? "" : icon))}
                aria-pressed={isSelected}
                aria-label={`アイコン ${icon}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors ${
                  isSelected
                    ? "border-foreground bg-foreground/10"
                    : "border-border bg-surface-muted hover:border-foreground/40"
                }`}
              >
                {icon}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          未選択の場合は表示名・メールアドレスの頭文字が使われます。
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-emerald-400">保存しました。</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:self-start sm:px-6"
      >
        {isPending ? "保存中…" : "プロフィールを保存"}
      </button>
    </form>
  );
}
