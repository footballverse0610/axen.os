/**
 * Supabaseの実テーブル構造に対応する型（supabase/migrations/001_initial_schema.sql参照）。
 * src/lib/types.ts はUIの仮データ用の型のため、こちらとは別に管理する。
 */

export type OnboardingCurrentState =
  | "serious"
  | "has_goal_but_inconsistent"
  | "unsure"
  | "passive"
  | "gradual";

export type OnboardingAvailableTime = "min_5_10" | "min_15_30" | "min_30_60" | "hour_plus";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  main_goals: string[];
  current_state: OnboardingCurrentState | null;
  three_month_goal: string | null;
  available_time: OnboardingAvailableTime | null;
  coach_preferences: string[];
  created_at: string;
  updated_at: string;
}

export type BusinessStage = "idea" | "preparing" | "operating" | "paused";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  one_liner: string | null;
  industry: string | null;
  stage: BusinessStage;
  founded_on: string | null;
  created_at: string;
  updated_at: string;
}

export type IdeaStage = "draft" | "validating" | "building" | "launched";

export interface BusinessIdea {
  id: string;
  business_id: string;
  user_id: string;
  title: string;
  description: string | null;
  stage: IdeaStage;
  potential_score: number;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskCategory = "商品" | "マーケティング" | "営業" | "資金調達" | "運営" | "その他";

export interface Task {
  id: string;
  business_id: string;
  user_id: string;
  business_idea_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  category: TaskCategory;
  done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GoalType = "revenue" | "profit" | "sales_count" | "custom";
export type GoalStatus = "active" | "achieved" | "missed" | "paused";

export interface Goal {
  id: string;
  business_id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  unit: string | null;
  start_date: string;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  user_id: string;
  business_idea_id: string | null;
  label: string;
  category: string;
  customer_name: string | null;
  quantity: number;
  amount: number;
  sold_on: string;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  user_id: string;
  business_idea_id: string | null;
  label: string;
  category: string;
  vendor: string | null;
  amount: number;
  is_tax_deductible: boolean;
  spent_on: string;
  created_at: string;
}

export type CoachRole = "user" | "coach";

export interface CoachMessage {
  id: string;
  business_id: string;
  user_id: string;
  role: CoachRole;
  content: string;
  created_at: string;
}
