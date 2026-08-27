"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import { getCurrentUser } from "./get-current-user";
import type { GoalStatus, GoalType } from "./types";

export interface GoalActionState {
  error: string | null;
  success?: boolean;
}

const GOAL_TYPES: GoalType[] = ["revenue", "profit", "sales_count", "custom"];
const GOAL_STATUSES: GoalStatus[] = ["active", "achieved", "missed", "paused"];

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_UNIT_LENGTH = 20;

interface ParsedGoalInput {
  title: string;
  description: string;
  goalType: string;
  targetValueRaw: string;
  currentValueRaw: string;
  unit: string;
  startDate: string;
  targetDate: string;
  status: string;
}

function parseGoalForm(formData: FormData): ParsedGoalInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    goalType: String(formData.get("goalType") ?? ""),
    targetValueRaw: String(formData.get("targetValue") ?? ""),
    currentValueRaw: String(formData.get("currentValue") ?? "0"),
    unit: String(formData.get("unit") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    targetDate: String(formData.get("targetDate") ?? "").trim(),
    status: String(formData.get("status") ?? "active"),
  };
}

function validateGoalInput(input: ParsedGoalInput): string | null {
  if (!input.title) {
    return "タイトルを入力してください。";
  }
  if (input.title.length > MAX_TITLE_LENGTH) {
    return `タイトルは${MAX_TITLE_LENGTH}文字以内で入力してください。`;
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    return `説明は${MAX_DESCRIPTION_LENGTH}文字以内で入力してください。`;
  }
  if (!GOAL_TYPES.includes(input.goalType as GoalType)) {
    return "目標の種類を選択してください。";
  }
  const targetValue = Number(input.targetValueRaw);
  if (input.targetValueRaw === "" || Number.isNaN(targetValue) || targetValue <= 0) {
    return "目標値は0より大きい数値を入力してください。";
  }
  const currentValue = input.currentValueRaw === "" ? 0 : Number(input.currentValueRaw);
  if (Number.isNaN(currentValue) || currentValue < 0) {
    return "現在値は0以上の数値を入力してください。";
  }
  if (input.unit.length > MAX_UNIT_LENGTH) {
    return `単位は${MAX_UNIT_LENGTH}文字以内で入力してください。`;
  }
  if (!input.startDate || Number.isNaN(Date.parse(input.startDate))) {
    return "開始日を入力してください。";
  }
  if (input.targetDate && Number.isNaN(Date.parse(input.targetDate))) {
    return "期限の形式が正しくありません。";
  }
  if (input.targetDate && input.targetDate < input.startDate) {
    return "期限は開始日以降の日付にしてください。";
  }
  if (!GOAL_STATUSES.includes(input.status as GoalStatus)) {
    return "ステータスを選択してください。";
  }
  return null;
}

/**
 * 新しい目標を作成する。
 * business_idはgetCurrentBusiness()、user_idはgetCurrentUser()由来の値のみを
 * 使用し、クライアントからのuser_id/business_id入力は一切受け付けない。
 */
export async function createGoal(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "事業が見つかりませんでした。" };
  }

  const parsed = parseGoalForm(formData);
  const validationError = validateGoalInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({
    business_id: business.id,
    user_id: user.id,
    title: parsed.title,
    description: parsed.description || null,
    goal_type: parsed.goalType as GoalType,
    target_value: Number(parsed.targetValueRaw),
    current_value: parsed.currentValueRaw === "" ? 0 : Number(parsed.currentValueRaw),
    unit: parsed.unit || null,
    start_date: parsed.startDate,
    target_date: parsed.targetDate || null,
    status: parsed.status as GoalStatus,
  });

  if (error) {
    console.error("createGoal failed", error);
    return { error: "目標の作成に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/goals");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 既存の目標を更新する。クライアントからは対象の goalId のみを受け取り、
 * business_id/user_idの指定は受け付けない。RLS(goalsのUPDATE:
 * auth.uid() = user_id)が「自分の目標しか更新できない」ことを保証する。
 */
export async function updateGoal(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const goalId = String(formData.get("goalId") ?? "");
  if (!goalId) {
    return { error: "対象の目標が見つかりませんでした。" };
  }

  const parsed = parseGoalForm(formData);
  const validationError = validateGoalInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .update({
      title: parsed.title,
      description: parsed.description || null,
      goal_type: parsed.goalType as GoalType,
      target_value: Number(parsed.targetValueRaw),
      current_value: parsed.currentValueRaw === "" ? 0 : Number(parsed.currentValueRaw),
      unit: parsed.unit || null,
      start_date: parsed.startDate,
      target_date: parsed.targetDate || null,
      status: parsed.status as GoalStatus,
    })
    .eq("id", goalId)
    .select("id");

  if (error) {
    console.error("updateGoal failed", error);
    return { error: "目標の更新に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象の目標が見つかりませんでした。" };
  }

  revalidatePath("/goals");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 目標を削除する。受け取るのは goalId のみ。RLS(DELETE:
 * auth.uid() = user_id)により、自分が所有する目標以外は削除できない。
 */
export async function deleteGoal(goalId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!goalId) {
    return { error: "対象の目標が見つかりませんでした。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("goals").delete().eq("id", goalId).select("id");

  if (error) {
    console.error("deleteGoal failed", error);
    return { error: "目標の削除に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象の目標が見つかりませんでした。" };
  }

  revalidatePath("/goals");
  revalidatePath("/");
  return { error: null };
}
