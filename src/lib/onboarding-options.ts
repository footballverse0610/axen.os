import type { OnboardingAvailableTime, OnboardingCurrentState } from "./supabase/types";

/**
 * /welcome(初回オンボーディング)の選択肢定義。
 * ウィザードUI(表示・バリデーション)とAI Coachへのコンテキスト整形
 * (formatCoachContext)の両方から参照する、単一の情報源。
 */

export const MAIN_GOAL_OPTIONS = [
  "勉強・進学",
  "スポーツ・体力",
  "お金・仕事",
  "自信",
  "人間関係",
  "目標達成",
  "生活習慣",
  "その他",
] as const;

export const COACH_PREFERENCE_OPTIONS = [
  "目標を決めたい",
  "計画を作ってほしい",
  "習慣を管理してほしい",
  "相談に乗ってほしい",
  "成長を分析してほしい",
  "背中を押してほしい",
  "優しくサポートしてほしい",
] as const;

export const CURRENT_STATE_OPTIONS: { value: OnboardingCurrentState; label: string }[] = [
  { value: "serious", label: "本気で変わりたい" },
  { value: "has_goal_but_inconsistent", label: "目標はあるけど続かない" },
  { value: "unsure", label: "何をしたいか分からない" },
  { value: "passive", label: "なんとなく毎日を過ごしている" },
  { value: "gradual", label: "少しずつ変わりたい" },
];

export const AVAILABLE_TIME_OPTIONS: { value: OnboardingAvailableTime; label: string }[] = [
  { value: "min_5_10", label: "5〜10分" },
  { value: "min_15_30", label: "15〜30分" },
  { value: "min_30_60", label: "30〜60分" },
  { value: "hour_plus", label: "1時間以上" },
];

export const currentStateLabel: Record<OnboardingCurrentState, string> = Object.fromEntries(
  CURRENT_STATE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<OnboardingCurrentState, string>;

export const availableTimeLabel: Record<OnboardingAvailableTime, string> = Object.fromEntries(
  AVAILABLE_TIME_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<OnboardingAvailableTime, string>;

export const MAX_THREE_MONTH_GOAL_LENGTH = 300;
