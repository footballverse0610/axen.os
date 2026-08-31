"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import { AVATAR_ICON_OPTIONS } from "../avatar-icons";

export interface ProfileActionState {
  error: string | null;
  success?: boolean;
}

const MAX_DISPLAY_NAME_LENGTH = 30;

function validateDisplayName(name: string): string | null {
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return `表示名は${MAX_DISPLAY_NAME_LENGTH}文字以内で入力してください。`;
  }
  return null;
}

/**
 * ログイン中ユーザー自身の表示名・プロフィールアイコンを更新する。
 * user_idはクライアントから受け取らず、必ずgetCurrentUser()由来の値を使う。
 * 保存対象は常に「自分自身のprofiles行」のみ(.eq("id", user.id))であり、
 * RLS(profiles_update_own: auth.uid() = id)が最終防波堤として働く。
 */
export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarIcon = String(formData.get("avatarIcon") ?? "").trim();

  const validationError = validateDisplayName(displayName);
  if (validationError) {
    return { error: validationError };
  }
  if (avatarIcon && !(AVATAR_ICON_OPTIONS as readonly string[]).includes(avatarIcon)) {
    return { error: "アイコンを選択してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      avatar_url: avatarIcon || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed", error);
    return { error: "プロフィールの更新に失敗しました。時間をおいて再度お試しください。" };
  }

  // Header等、表示名・アイコンを表示している全画面に即座に反映させる。
  revalidatePath("/", "layout");

  return { error: null, success: true };
}
