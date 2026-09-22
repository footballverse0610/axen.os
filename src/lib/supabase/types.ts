/**
 * Supabaseの実テーブル構造に対応する型（supabase/migrations/001_initial_schema.sql参照）。
 * src/lib/types.ts はUIの仮データ用の型のため、こちらとは別に管理する。
 */

/** オンボーディングQ5「起業に使える時間」(週あたり)。 */
export type OnboardingWeeklyTime = "under_5h" | "5_15h" | "15_30h" | "over_30h";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  /** オンボーディングQ3「今、一番の課題は？」で選択した項目(複数選択)。 */
  current_challenges: string[];
  weekly_available_time: OnboardingWeeklyTime | null;
  /** オンボーディングQ6「初期予算」(任意)。未回答ならnull。 */
  initial_budget_range: string | null;
  /**
   * オンボーディングQ1で「まだアイデアがない」を選んだユーザーはtrue。
   * AI Coachが初回の会話でアイデア出しを優先するかどうかの分岐に使う。
   */
  needs_idea_help: boolean;
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
/**
 * 自由入力(supabase/migrations/003_task_category_freetext.sql)。
 * 以前はDBのtask_category enumに対応した固定6値のunion型だったが、
 * カテゴリー自由入力化に伴いstringへ変更した。
 */
export type TaskCategory = string;

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
