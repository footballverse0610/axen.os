import type { BadgeTone } from "@/components/ui/Badge";
import type { GoalStatus, GoalType } from "./supabase/types";

export const goalStatusLabel: Record<GoalStatus, string> = {
  active: "進行中",
  achieved: "達成",
  missed: "未達成",
  paused: "一時停止",
};

export const goalStatusTone: Record<GoalStatus, BadgeTone> = {
  active: "warning",
  achieved: "good",
  missed: "critical",
  paused: "neutral",
};

export const goalTypeLabel: Record<GoalType, string> = {
  revenue: "売上目標",
  profit: "利益目標",
  sales_count: "販売件数目標",
  custom: "カスタム目標",
};

/**
 * ユーザーが手動で選択できるステータス(「達成」は自動判定専用のため除外)。
 * ステータス選択UI(GoalForm)はこの3つのみを選択肢として表示する。
 */
export const MANUAL_GOAL_STATUS_OPTIONS: GoalStatus[] = ["missed", "active", "paused"];

/**
 * current_value >= target_value の場合は常に「達成」を表示する
 * (自動達成判定)。それ以外は、保存されているstatus(未達成/進行中/
 * 一時停止としてユーザーが最後に手動設定した値)をそのまま表示する。
 *
 * DBのstatus列そのものは書き換えない。あくまで表示用の計算であり、
 * 現在値が目標値を下回ればすぐに手動設定していたステータスへ戻る
 * (goal-actions.tsは変更していないため、既存データとの互換性もそのまま
 * 保たれる: 既に達成条件を満たしている既存Goalも、保存されている
 * statusが「未達成/進行中/一時停止」のいずれであっても、この関数を
 * 通せば自動的に「達成」として表示される)。
 */
export function getDisplayGoalStatus(
  currentValue: number,
  targetValue: number,
  storedStatus: GoalStatus,
): GoalStatus {
  if (currentValue >= targetValue) {
    return "achieved";
  }
  return storedStatus;
}
