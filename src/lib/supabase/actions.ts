"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";
import { translateAuthError } from "./error-messages";

export interface AuthActionState {
  error: string | null;
  success?: string | null;
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error) };
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

  // TODO(次Phase): サインアップ成功時、data.user.id を使って profiles テーブルに
  // 初期レコードを作成する(businesses等の作成フローとあわせて実装する)。
  // 現時点ではDB書き込みは行わない。

  if (data.session) {
    // メール確認が無効な設定の場合、この時点で既にログイン済みになる。
    redirect("/");
  }

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
