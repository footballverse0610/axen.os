import type { OnboardingWeeklyTime } from "./supabase/types";

/**
 * /welcome(初回オンボーディング)の選択肢定義。
 * ウィザードUI(表示・バリデーション)とAI Coachへのコンテキスト整形
 * (formatCoachContext)の両方から参照する、単一の情報源。
 *
 * 「起業しよ。」は起業・事業づくり支援アプリのため、選択肢は全て
 * 事業の状況・課題・目標に直結する項目のみで構成する
 * (人生観・趣味・性格等の設問は扱わない)。
 */

/** Q1「今の起業ステージは？」の選択肢。 */
export type StartupStage = "idea_none" | "idea" | "preparing" | "operating" | "revenue";

export const STARTUP_STAGE_OPTIONS: { value: StartupStage; label: string }[] = [
  { value: "idea_none", label: "まだアイデアがない" },
  { value: "idea", label: "アイデアがある" },
  { value: "preparing", label: "準備中" },
  { value: "operating", label: "すでに事業を開始している" },
  { value: "revenue", label: "売上がある" },
];

/** 業種のプリセット候補。既存の industry(text) 列はそのまま自由記述文字列を保存する。 */
export const INDUSTRY_OPTIONS: string[] = [
  "飲食",
  "IT・Web",
  "小売・EC",
  "美容・健康",
  "教育",
  "コンサルティング",
  "デザイン・クリエイティブ",
  "製造",
  "建設・不動産",
  "医療・福祉",
];

export const OTHER_INDUSTRY_VALUE = "__other__";

/** Q3「今、一番の課題は？」の選択肢(複数選択)。 */
export const CHALLENGE_OPTIONS = [
  "アイデア",
  "集客",
  "商品・サービス作り",
  "売上",
  "資金",
  "時間",
  "SNS・マーケティング",
  "その他",
] as const;

/** Q4「売上目標はありますか？」の期間選択肢。 */
export const GOAL_PERIOD_OPTIONS = [
  { value: "1", label: "1ヶ月" },
  { value: "3", label: "3ヶ月" },
  { value: "6", label: "6ヶ月" },
  { value: "12", label: "1年" },
] as const;

/** Q5「起業に使える時間は？」の選択肢(週あたり)。 */
export const WEEKLY_TIME_OPTIONS: { value: OnboardingWeeklyTime; label: string }[] = [
  { value: "under_5h", label: "週5時間未満" },
  { value: "5_15h", label: "週5〜15時間" },
  { value: "15_30h", label: "週15〜30時間" },
  { value: "over_30h", label: "週30時間以上" },
];

/** Q6「初期予算」の選択肢(任意)。 */
export const BUDGET_OPTIONS = [
  "自己資金なし",
  "〜10万円",
  "10〜50万円",
  "50〜300万円",
  "300万円以上",
  "まだ分からない",
] as const;

export const weeklyTimeLabel: Record<OnboardingWeeklyTime, string> = Object.fromEntries(
  WEEKLY_TIME_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<OnboardingWeeklyTime, string>;

export const MAX_GOAL_AMOUNT = 1_000_000_000;
