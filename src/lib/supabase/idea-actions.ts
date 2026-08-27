"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import { getCurrentUser } from "./get-current-user";
import type { IdeaStage } from "./types";

export interface IdeaActionState {
  error: string | null;
  success?: boolean;
}

const IDEA_STAGES: IdeaStage[] = ["draft", "validating", "building", "launched"];
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

interface ParsedIdeaInput {
  title: string;
  description: string;
  stage: string;
  potentialScoreRaw: string;
  potentialScore: number;
}

function parseIdeaForm(formData: FormData): ParsedIdeaInput {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const stage = String(formData.get("stage") ?? "");
  const potentialScoreRaw = String(formData.get("potentialScore") ?? "");
  return {
    title,
    description,
    stage,
    potentialScoreRaw,
    potentialScore: Number(potentialScoreRaw),
  };
}

function validateIdeaInput(input: ParsedIdeaInput): string | null {
  if (!input.title) {
    return "タイトルを入力してください。";
  }
  if (input.title.length > MAX_TITLE_LENGTH) {
    return `タイトルは${MAX_TITLE_LENGTH}文字以内で入力してください。`;
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    return `説明は${MAX_DESCRIPTION_LENGTH}文字以内で入力してください。`;
  }
  if (!IDEA_STAGES.includes(input.stage as IdeaStage)) {
    return "ステージを選択してください。";
  }
  if (input.potentialScoreRaw === "" || Number.isNaN(input.potentialScore)) {
    return "ポテンシャルスコアを入力してください。";
  }
  if (
    !Number.isInteger(input.potentialScore) ||
    input.potentialScore < 0 ||
    input.potentialScore > 100
  ) {
    return "ポテンシャルスコアは0〜100の整数で入力してください。";
  }
  return null;
}

/**
 * 新しいビジネスアイデアを作成する。
 * business_idはgetCurrentBusiness()、user_idはgetCurrentUser()由来の値のみを
 * 使用し、クライアントからのuser_id/business_id入力は一切受け付けない。
 */
export async function createIdea(
  _prevState: IdeaActionState,
  formData: FormData,
): Promise<IdeaActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "事業が見つかりませんでした。" };
  }

  const parsed = parseIdeaForm(formData);
  const validationError = validateIdeaInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("business_ideas").insert({
    business_id: business.id,
    user_id: user.id,
    title: parsed.title,
    description: parsed.description || null,
    stage: parsed.stage as IdeaStage,
    potential_score: parsed.potentialScore,
  });

  if (error) {
    console.error("createIdea failed", error);
    return { error: "アイデアの作成に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/ideas");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 既存のビジネスアイデアを更新する。
 * クライアントからは対象の ideaId のみを受け取り、business_id/user_idの
 * 指定は受け付けない。RLS(business_ideasのUPDATE: auth.uid() = user_id)が
 * 「自分のアイデアしか更新できない」ことを保証する。他ユーザーのIDが
 * 渡された場合は対象行が0件になる(存在有無を区別しない汎用エラーを返す)。
 */
export async function updateIdea(
  _prevState: IdeaActionState,
  formData: FormData,
): Promise<IdeaActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const ideaId = String(formData.get("ideaId") ?? "");
  if (!ideaId) {
    return { error: "対象のアイデアが見つかりませんでした。" };
  }

  const parsed = parseIdeaForm(formData);
  const validationError = validateIdeaInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_ideas")
    .update({
      title: parsed.title,
      description: parsed.description || null,
      stage: parsed.stage as IdeaStage,
      potential_score: parsed.potentialScore,
    })
    .eq("id", ideaId)
    .select("id");

  if (error) {
    console.error("updateIdea failed", error);
    return { error: "アイデアの更新に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象のアイデアが見つかりませんでした。" };
  }

  revalidatePath("/ideas");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * ビジネスアイデアを削除する。
 * 受け取るのは ideaId のみ。RLS(DELETE: auth.uid() = user_id)により、
 * 自分が所有するアイデア以外は対象行が0件になり削除できない。
 */
export async function deleteIdea(ideaId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!ideaId) {
    return { error: "対象のアイデアが見つかりませんでした。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_ideas")
    .delete()
    .eq("id", ideaId)
    .select("id");

  if (error) {
    console.error("deleteIdea failed", error);
    return { error: "アイデアの削除に失敗しました。時間をおいて再度お試しください。" };
  }

  if (!data || data.length === 0) {
    return { error: "対象のアイデアが見つかりませんでした。" };
  }

  revalidatePath("/ideas");
  revalidatePath("/");
  return { error: null };
}
