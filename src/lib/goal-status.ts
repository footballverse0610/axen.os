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
