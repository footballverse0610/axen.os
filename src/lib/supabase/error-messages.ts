import type { AuthError } from "@supabase/supabase-js";

/**
 * Supabase AuthのエラーコードをUIに表示できる日本語メッセージへ変換する。
 * ログイン失敗時にメールアドレスの存在有無が推測できてしまわないよう、
 * 資格情報関連のエラーは全て同一の文言にまとめている。
 */
const messagesByCode: Record<string, string> = {
  invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
  user_not_found: "メールアドレスまたはパスワードが正しくありません。",
  email_not_confirmed:
    "メールアドレスの確認が完了していません。届いた確認メール内のリンクをご確認ください。",
  user_already_exists: "このメールアドレスは既に登録されています。ログインをお試しください。",
  weak_password: "パスワードが弱すぎます。別のパスワードをお試しください。",
  email_address_invalid: "メールアドレスの形式が正しくありません。",
  validation_failed: "入力内容をご確認ください。",
  over_email_send_rate_limit: "リクエストが多すぎます。しばらく時間をおいてお試しください。",
  over_request_rate_limit: "リクエストが多すぎます。しばらく時間をおいてお試しください。",
  signup_disabled: "現在、新規登録を受け付けていません。",
};

export function translateAuthError(error: AuthError): string {
  if (error.code && messagesByCode[error.code]) {
    return messagesByCode[error.code];
  }
  return "処理に失敗しました。入力内容をご確認のうえ、もう一度お試しください。";
}
