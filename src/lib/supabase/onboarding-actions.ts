"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import {
  AVAILABLE_TIME_OPTIONS,
  COACH_PREFERENCE_OPTIONS,
  CURRENT_STATE_OPTIONS,
  MAIN_GOAL_OPTIONS,
  MAX_THREE_MONTH_GOAL_LENGTH,
} from "../onboarding-options";
import type { OnboardingAvailableTime, OnboardingCurrentState } from "./types";

export interface OnboardingProfileInput {
  mainGoals: string[];
  currentState: string;
  threeMonthGoal: string;
  availableTime: string;
  coachPreferences: string[];
}

const MAIN_GOAL_VALUES: readonly string[] = MAIN_GOAL_OPTIONS;
const COACH_PREFERENCE_VALUES: readonly string[] = COACH_PREFERENCE_OPTIONS;
const CURRENT_STATE_VALUES = CURRENT_STATE_OPTIONS.map((o) => o.value);
const AVAILABLE_TIME_VALUES = AVAILABLE_TIME_OPTIONS.map((o) => o.value);

function validateOnboardingInput(input: OnboardingProfileInput): string | null {
  if (
    input.mainGoals.length === 0 ||
    !input.mainGoals.every((v) => MAIN_GOAL_VALUES.includes(v))
  ) {
    return "「今、一番変えたいこと」を1つ以上選択してください。";
  }
  if (!CURRENT_STATE_VALUES.includes(input.currentState as OnboardingCurrentState)) {
    return "「今の自分に一番近いもの」を選択してください。";
  }
  const goal = input.threeMonthGoal.trim();
  if (!goal) {
    return "「3ヶ月後、どうなっていたいか」を入力してください。";
  }
  if (goal.length > MAX_THREE_MONTH_GOAL_LENGTH) {
    return `3ヶ月後の目標は${MAX_THREE_MONTH_GOAL_LENGTH}文字以内で入力してください。`;
  }
  if (!AVAILABLE_TIME_VALUES.includes(input.availableTime as OnboardingAvailableTime)) {
    return "「1日に使える時間」を選択してください。";
  }
  if (
    input.coachPreferences.length === 0 ||
    !input.coachPreferences.every((v) => COACH_PREFERENCE_VALUES.includes(v))
  ) {
    return "「AIコーチに何をしてほしいか」を1つ以上選択してください。";
  }
  return null;
}

/**
 * 初回オンボーディング(/welcome)で収集した回答をprofilesへ保存し、
 * onboarding_completedをtrueにする。
 *
 * user_idはクライアントから受け取らず、必ずgetCurrentUser()由来の値を使う。
 * 保存対象は常に「自分自身のprofiles行」のみ(.eq("id", user.id))であり、
 * RLS(profiles_update_own: auth.uid() = id)が最終防波堤として働く。
 *
 * クライアント側の選択制御をバイパスされても安全なよう、選択肢の妥当性を
 * サーバー側でも再検証する。
 */
export async function saveOnboardingProfile(
  input: OnboardingProfileInput,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const validationError = validateOnboardingInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      main_goals: input.mainGoals,
      current_state: input.currentState as OnboardingCurrentState,
      three_month_goal: input.threeMonthGoal.trim(),
      available_time: input.availableTime as OnboardingAvailableTime,
      coach_preferences: input.coachPreferences,
    })
    .eq("id", user.id);

  if (error) {
    console.error("saveOnboardingProfile failed", error);
    return {
      error:
        "保存に失敗しました。時間をおいて再度お試しください(データベースの更新が必要な場合があります)。",
    };
  }

  // 事業作成onboarding(createBusiness)と同じく、成功時はここでredirectする。
  // "/" へ遷移後は(main)/layout.tsxが、事業未作成なら/onboardingへ、
  // 作成済みならそのままホームへ、を判定する。
  revalidatePath("/", "layout");
  redirect("/");
}
