"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import { getCurrentUser } from "./get-current-user";
import { DEFAULT_TASK_CATEGORY } from "../task-categories";
import type { TaskPriority } from "./types";

export interface TaskActionState {
  error: string | null;
  success?: boolean;
}

const TASK_PRIORITIES: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 50;

interface ParsedTaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  category: string;
}

function parseTaskForm(formData: FormData): ParsedTaskInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    priority: String(formData.get("priority") ?? ""),
    category: String(formData.get("category") ?? ""),
  };
}

function validateTaskInput(input: ParsedTaskInput): string | null {
  if (!input.title) {
    return "タイトルを入力してください。";
  }
  if (input.title.length > MAX_TITLE_LENGTH) {
    return `タイトルは${MAX_TITLE_LENGTH}文字以内で入力してください。`;
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    return `説明は${MAX_DESCRIPTION_LENGTH}文字以内で入力してください。`;
  }
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    return "期限の形式が正しくありません。";
  }
  if (!TASK_PRIORITIES.includes(input.priority as TaskPriority)) {
    return "優先度を選択してください。";
  }
  if (input.category.length > MAX_CATEGORY_LENGTH) {
    return `カテゴリーは${MAX_CATEGORY_LENGTH}文字以内で入力してください。`;
  }
  return null;
}

/** カテゴリーが空欄の場合、DBのNOT NULL制約に合わせて既定値を補う。 */
function resolveCategory(rawCategory: string): string {
  return rawCategory.trim() || DEFAULT_TASK_CATEGORY;
}

/**
 * 新しいタスクを作成する。
 * business_idはgetCurrentBusiness()、user_idはgetCurrentUser()由来の値のみを
 * 使用し、クライアントからのuser_id/business_id入力は一切受け付けない。
 */
export async function createTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "事業が見つかりませんでした。" };
  }

  const parsed = parseTaskForm(formData);
  const validationError = validateTaskInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    business_id: business.id,
    user_id: user.id,
    title: parsed.title,
    description: parsed.description || null,
    due_date: parsed.dueDate || null,
    priority: parsed.priority as TaskPriority,
    category: resolveCategory(parsed.category),
  });

  if (error) {
    console.error("createTask failed", error);
    return { error: "タスクの作成に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 既存タスクを更新する。クライアントからは対象の taskId のみを受け取り、
 * business_id/user_idの指定は受け付けない。RLS(tasksのUPDATE:
 * auth.uid() = user_id)が「自分のタスクしか更新できない」ことを保証する。
 */
export async function updateTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  const parsed = parseTaskForm(formData);
  const validationError = validateTaskInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: parsed.title,
      description: parsed.description || null,
      due_date: parsed.dueDate || null,
      priority: parsed.priority as TaskPriority,
      category: resolveCategory(parsed.category),
    })
    .eq("id", taskId)
    .select("id");

  if (error) {
    console.error("updateTask failed", error);
    return { error: "タスクの更新に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * タスクの完了/未完了を切り替える。doneに応じてcompleted_atも更新する。
 * 受け取るのは taskId と 切り替え後の done のみ。
 */
export async function toggleTaskDone(
  taskId: string,
  done: boolean,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!taskId) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      done,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .select("id");

  if (error) {
    console.error("toggleTaskDone failed", error);
    return { error: "タスクの更新に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { error: null };
}

/**
 * 「何から始める？」診断(start-guide)の提案から、タイトル・カテゴリーのみで
 * タスクを1タップ追加する軽量版。優先度は既定でMEDIUM、期限・説明は空にする
 * (詳細な調整は/tasksの通常編集フォームで行う想定)。createTaskと同じ
 * tasksテーブル・business_id/user_id解決・RLSをそのまま利用するだけで、
 * 新しいタスク管理の仕組みは作らない。
 */
export async function quickAddTask(
  title: string,
  category: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { error: "タイトルを入力してください。" };
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return { error: `タイトルは${MAX_TITLE_LENGTH}文字以内で入力してください。` };
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "事業が見つかりませんでした。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    business_id: business.id,
    user_id: user.id,
    title: trimmedTitle,
    description: null,
    due_date: null,
    priority: "MEDIUM" satisfies TaskPriority,
    category: resolveCategory(category),
  });

  if (error) {
    console.error("quickAddTask failed", error);
    return { error: "タスクの追加に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { error: null };
}

/**
 * タスクを削除する。受け取るのは taskId のみ。RLS(DELETE:
 * auth.uid() = user_id)により、自分が所有するタスク以外は削除できない。
 */
export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!taskId) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id");

  if (error) {
    console.error("deleteTask failed", error);
    return { error: "タスクの削除に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象のタスクが見つかりませんでした。" };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { error: null };
}
