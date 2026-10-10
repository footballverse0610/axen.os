"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  updateCoachCharacter,
  type CoachCharacterActionState,
} from "@/lib/supabase/coach-character-actions";
import { COACH_CHARACTER_LIST, resolveCoachCharacter } from "@/lib/coach/characters";
import { CoachCharacterAvatar } from "@/components/coach/CoachCharacterAvatar";
import type { Profile } from "@/lib/supabase/types";

const initialState: CoachCharacterActionState = { error: null };

/**
 * 設定画面から、4人のAIコーチを比較しながらいつでも変更できるフォーム。
 * 保存はprofiles.coach_characterの1列のみを更新するupdateCoachCharacter
 * (Server Action)を呼ぶだけで、チャット履歴・事業データ等には触れない。
 */
export function CoachCharacterForm({ profile }: { profile: Profile | null }) {
  const current = resolveCoachCharacter(profile?.coach_character);
  const [state, formAction, isPending] = useActionState(updateCoachCharacter, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {COACH_CHARACTER_LIST.map((character) => {
        const isCurrent = character.id === current.id;
        return (
          <label
            key={character.id}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
              isCurrent
                ? "border-primary bg-primary/5"
                : "border-border bg-surface hover:bg-surface-muted"
            }`}
          >
            <input
              type="radio"
              name="characterId"
              value={character.id}
              defaultChecked={isCurrent}
              className="sr-only"
            />
            <CoachCharacterAvatar characterId={character.id} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{character.name}</p>
                <span className="text-xs text-muted-foreground">{character.typeLabel}</span>
                {isCurrent ? (
                  <Check className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {character.description}
              </p>
            </div>
          </label>
        );
      })}

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-green-400">保存しました。</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:self-start sm:px-6"
      >
        {isPending ? "保存中…" : "この内容で保存"}
      </button>
    </form>
  );
}
