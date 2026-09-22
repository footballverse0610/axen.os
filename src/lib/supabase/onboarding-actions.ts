"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import { setCurrentBusinessCookie } from "./business";
import { recalcLinkedGoals } from "./goal-sync";
import {
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
  GOAL_PERIOD_OPTIONS,
  MAX_GOAL_AMOUNT,
  STARTUP_STAGE_OPTIONS,
  WEEKLY_TIME_OPTIONS,
  type StartupStage,
} from "../onboarding-options";
import type { BusinessStage, OnboardingWeeklyTime } from "./types";

export interface OnboardingInput {
  startupStage: string;
  businessName: string;
  businessOneLiner: string;
  businessIndustry: string;
  challenges: string[];
  weeklyTime: string;
  budgetRange: string;
  goalAmount: string;
  goalPeriodMonths: string;
}

const STARTUP_STAGE_VALUES = STARTUP_STAGE_OPTIONS.map((o) => o.value);
const WEEKLY_TIME_VALUES = WEEKLY_TIME_OPTIONS.map((o) => o.value);
const CHALLENGE_VALUES: readonly string[] = CHALLENGE_OPTIONS;
const BUDGET_VALUES: readonly string[] = BUDGET_OPTIONS;
const GOAL_PERIOD_VALUES = GOAL_PERIOD_OPTIONS.map((o) => o.value);

/** 事業ステージへのマッピング。「まだアイデアがない」「アイデアがある」は
 * どちらもbusinesses.stage='idea'として保存する(区別はprofiles.needs_idea_helpで行う)。
 * 「すでに事業を開始している」「売上がある」はどちらも'operating'として保存する
 * (売上の有無は今後salesテーブルの実データに現れるため、onboarding時点で
 * 別のステージ値を新設する必要はない)。
 */
const STAGE_BY_STARTUP_STAGE: Record<StartupStage, BusinessStage> = {
  idea_none: "idea",
  idea: "idea",
  preparing: "preparing",
  operating: "operating",
  revenue: "operating",
};

const MAX_NAME_LENGTH = 100;
const MAX_ONE_LINER_LENGTH = 200;
const MAX_INDUSTRY_LENGTH = 50;

function validateOnboardingInput(input: OnboardingInput): string | null {
  if (!STARTUP_STAGE_VALUES.includes(input.startupStage as StartupStage)) {
    return "「今の起業ステージ」を選択してください。";
  }
  if (input.businessName.length > MAX_NAME_LENGTH) {
    return `事業名は${MAX_NAME_LENGTH}文字以内で入力してください。`;
  }
  if (input.businessOneLiner.length > MAX_ONE_LINER_LENGTH) {
    return `事業内容は${MAX_ONE_LINER_LENGTH}文字以内で入力してください。`;
  }
  if (input.businessIndustry.length > MAX_INDUSTRY_LENGTH) {
    return `業種は${MAX_INDUSTRY_LENGTH}文字以内で入力してください。`;
  }
  if (
    input.challenges.length === 0 ||
    !input.challenges.every((v) => CHALLENGE_VALUES.includes(v))
  ) {
    return "「今、一番の課題」を1つ以上選択してください。";
  }
  if (!WEEKLY_TIME_VALUES.includes(input.weeklyTime as OnboardingWeeklyTime)) {
    return "「起業に使える時間」を選択してください。";
  }
  if (input.budgetRange && !BUDGET_VALUES.includes(input.budgetRange)) {
    return "「初期予算」の選択内容が正しくありません。";
  }
  if (input.goalAmount) {
    const amount = Number(input.goalAmount);
    if (Number.isNaN(amount) || amount <= 0 || amount > MAX_GOAL_AMOUNT) {
      return "売上目標は正しい金額を入力してください。";
    }
    if (!GOAL_PERIOD_VALUES.includes(input.goalPeriodMonths as (typeof GOAL_PERIOD_VALUES)[number])) {
      return "売上目標の期間を選択してください。";
    }
  }
  return null;
}

function addMonthsIsoDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * 初回オンボーディング(/welcome)で収集した回答を保存する。
 *
 * - profiles: onboarding_completed/current_challenges/weekly_available_time/
 *   initial_budget_range/needs_idea_help を更新
 * - businesses: 「まだアイデアがない」ユーザーも含め、必ず1件作成する
 *   (事業名が未入力でも自動的に仮の名前を割り当てる。後からいつでも
 *   settings/事業編集で変更できる)。以降のbusiness_ideas/tasks/goals等は
 *   全てbusiness_idを前提とする既存設計のため、ここで確実に1件作っておく。
 * - goals: 売上目標が入力されていれば、business作成直後にrevenue型のgoalを
 *   1件作成する(既存のgoal-actions.tsのcreateGoalと同じテーブル・型を利用)。
 *
 * user_idはクライアントから受け取らず、必ずgetCurrentUser()由来の値を使う。
 * 選択肢の妥当性はクライアント側の制御をバイパスされても安全なよう、
 * サーバー側でも再検証する。
 */
export async function saveOnboardingProfile(
  input: OnboardingInput,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const validationError = validateOnboardingInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const startupStage = input.startupStage as StartupStage;
  const needsIdeaHelp = startupStage === "idea_none";

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      current_challenges: input.challenges,
      weekly_available_time: input.weeklyTime as OnboardingWeeklyTime,
      initial_budget_range: input.budgetRange || null,
      needs_idea_help: needsIdeaHelp,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("saveOnboardingProfile: profiles更新失敗", profileError);
    return {
      error:
        "保存に失敗しました。時間をおいて再度お試しください(データベースの更新が必要な場合があります)。",
    };
  }

  const trimmedName = input.businessName.trim();
  let businessName = trimmedName;
  if (!businessName) {
    const { count } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true });
    businessName = `事業${(count ?? 0) + 1}`;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      user_id: user.id,
      name: businessName,
      one_liner: input.businessOneLiner.trim() || null,
      industry: input.businessIndustry.trim() || null,
      stage: STAGE_BY_STARTUP_STAGE[startupStage],
    })
    .select("id")
    .single();

  if (businessError || !business) {
    console.error("saveOnboardingProfile: businesses作成失敗", businessError);
    return { error: "事業の作成に失敗しました。時間をおいて再度お試しください。" };
  }

  await setCurrentBusinessCookie(business.id);

  if (input.goalAmount) {
    const periodMonths = Number(input.goalPeriodMonths);
    const { error: goalError } = await supabase.from("goals").insert({
      business_id: business.id,
      user_id: user.id,
      title: "売上目標",
      goal_type: "revenue",
      target_value: Number(input.goalAmount),
      current_value: 0,
      unit: "円",
      start_date: new Date().toISOString().slice(0, 10),
      target_date: addMonthsIsoDate(periodMonths),
      status: "active",
    });

    if (goalError) {
      // 目標の作成に失敗しても、オンボーディング自体は完了させる
      // (目標は後から/goalsページでいつでも作成できるベストエフォートの項目のため)。
      console.error("saveOnboardingProfile: goals作成失敗", goalError);
    } else {
      await recalcLinkedGoals(business.id);
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}
