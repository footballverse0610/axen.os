"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "./server";
import { translateAuthError } from "./error-messages";
import { getCurrentUser } from "./get-current-user";
import { setCurrentBusinessCookie } from "./business";
import type { BusinessStage } from "./types";

export interface AuthActionState {
  error: string | null;
  success?: string | null;
}

/**
 * profilesに最低限のレコード(id = auth.users.id)が存在することを保証する。
 * 既に存在する場合は何もしない(upsert + ignoreDuplicates)。
 *
 * サインアップ直後にセッションが無い(メール確認待ち)ケースでは、この時点では
 * auth.uid()が定まらずRLSにより書き込めないため、ここでは呼ばない。
 * 代わりに、実際にセッションが確立するタイミング(signup成功時にセッションが
 * 即発行される場合、またはlogin成功時)でこの関数を呼び、確実にカバーする。
 * 失敗してもログイン/登録自体は妨げない(ベストエフォート)。
 */
async function ensureProfileExists(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    console.error("ensureProfileExists failed", error);
  }
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }
  if (!password) {
    return { error: "パスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error) };
  }

  if (data.user) {
    await ensureProfileExists(data.user.id);
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }
  if (!password) {
    return { error: "パスワードを入力してください。" };
  }
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "パスワードが一致しません。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: translateAuthError(error) };
  }

  if (data.session && data.user) {
    // メール確認が無効な設定の場合、この時点で既にログイン済み(auth.uid()が
    // 定まる)ため、ここでprofilesを作成できる。
    await ensureProfileExists(data.user.id);
    redirect("/");
  }

  // メール確認が有効な設定の場合はセッションがまだ無い。profilesの作成は、
  // 実際にログインしてセッションが確立した時点(login内)で行う。
  return {
    error: null,
    success:
      "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * リダイレクトURL組み立て用に、現在のリクエストのオリジンを取得する。
 * Server Actionはfetch()経由のPOSTとして呼ばれるため、Originヘッダーが
 * 通常付与される。念のためhost/x-forwarded-protoからも組み立てられるよう
 * フォールバックする(末尾のURLはSupabase側の許可リストで最終的に検証される)。
 */
async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) {
    return origin;
  }
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * パスワード再設定メールを送信する。
 * user_idはここでは使わず(未ログイン状態から呼ばれるため)、メールアドレスを
 * Supabase Authへそのまま渡すのみ。Supabaseは対象メールアドレスの存在有無に
 * 関わらず常に同じ成功レスポンスを返す仕様のため、ここで存在確認の分岐を
 * 追加しない(メールアドレスの存在を第三者に明示しないため)。
 *
 * リセットリンクはsrc/app/auth/confirm/route.tsで検証し、
 * /update-password へ遷移させる。
 */
export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  });

  if (error) {
    return { error: translateAuthError(error) };
  }

  return {
    error: null,
    success: "パスワード再設定用のメールを送信しました。メールをご確認ください。",
  };
}

/**
 * 新しいパスワードを設定する。
 * /auth/confirm でのトークン検証によって確立された正規のセッションが
 * 前提のため、ここでも改めてgetCurrentUser()で認証確認を行う
 * (未ログインでの呼び出しを許さない)。
 */
export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!password) {
    return { error: "新しいパスワードを入力してください。" };
  }
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "パスワードが一致しません。" };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: translateAuthError(error) };
  }

  redirect("/");
}

export interface BusinessActionState {
  error: string | null;
}

const BUSINESS_STAGES: BusinessStage[] = ["idea", "preparing", "operating", "paused"];

const MAX_NAME_LENGTH = 100;
const MAX_ONE_LINER_LENGTH = 200;
const MAX_INDUSTRY_LENGTH = 50;

/**
 * 事業を作成する。初回設定(オンボーディング)の最初の事業作成と、
 * ログイン後に2つ目以降の事業を追加するケースの両方から共通で呼ばれる
 * (呼び出し元のUIが異なるだけで、作成ロジックは1つに統一している)。
 * user_idはクライアントからの入力を一切信用せず、必ずgetCurrentUser()の
 * 結果(サーバー側でCookieのセッションから検証した値)を使用する。
 */
export async function createBusiness(
  _prevState: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const oneLiner = String(formData.get("oneLiner") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const stage = String(formData.get("stage") ?? "");

  if (!name) {
    return { error: "事業名を入力してください。" };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `事業名は${MAX_NAME_LENGTH}文字以内で入力してください。` };
  }
  if (oneLiner.length > MAX_ONE_LINER_LENGTH) {
    return { error: `事業内容は${MAX_ONE_LINER_LENGTH}文字以内で入力してください。` };
  }
  if (industry.length > MAX_INDUSTRY_LENGTH) {
    return { error: `業種は${MAX_INDUSTRY_LENGTH}文字以内で入力してください。` };
  }
  if (!BUSINESS_STAGES.includes(stage as BusinessStage)) {
    return { error: "事業ステージを選択してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      user_id: user.id,
      name,
      one_liner: oneLiner || null,
      industry: industry || null,
      stage: stage as BusinessStage,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "同じ名前の事業が既に存在します。別の名前を入力してください。" };
    }
    console.error("createBusiness failed", error);
    return { error: "事業の作成に失敗しました。時間をおいて再度お試しください。" };
  }

  // 新しく作成した事業を選択中にする(初回設定では唯一の事業になるため
  // 実質的に無影響、2つ目以降の追加では新しい事業へ切り替わる)。
  await setCurrentBusinessCookie(data.id);

  redirect("/");
}
