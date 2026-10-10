"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import { isCoachCharacterId } from "../coach/characters";

export interface CoachCharacterActionState {
  error: string | null;
  success?: boolean;
}

/**
 * ログイン中ユーザー自身のAIコーチ(性格)を設定画面から変更する。
 *
 * クライアントから送られるcharacterIdは、たとえ画面上の選択肢を
 * バイパスされても安全なよう、必ずisCoachCharacterId()で有効な4値の
 * いずれかかをサーバー側で再検証する(無効な値はそのまま信用しない)。
 *
 * 保存対象は常に自分自身のprofiles行のみ(.eq("id", user.id))であり、
 * RLS(profiles_update_own: auth.uid() = id)が最終的なアクセス制御を担う。
 * チャット履歴・事業・タスク・目標・財務データ・アイデア等、他のテーブルは
 * 一切変更しない。
 */
export async function updateCoachCharacter(
  _prevState: CoachCharacterActionState,
  formData: FormData,
): Promise<CoachCharacterActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const characterId = String(formData.get("characterId") ?? "");
  if (!isCoachCharacterId(characterId)) {
    return { error: "選択内容が正しくありません。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ coach_character: characterId })
    .eq("id", user.id);

  if (error) {
    console.error("updateCoachCharacter failed", error);
    return { error: "AIコーチの変更に失敗しました。時間をおいて再度お試しください。" };
  }

  // 次回以降のチャット(/api/coach)はprofilesを都度再取得して
  // system promptを組み立てるため、ここでのrevalidatePathは表示の即時反映用。
  revalidatePath("/settings");
  revalidatePath("/coach");
  revalidatePath("/");

  return { error: null, success: true };
}
