"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import {
  clearCurrentBusinessCookie,
  getCurrentBusiness,
  getUserBusinesses,
  setCurrentBusinessCookie,
} from "./business";

/**
 * 現在選択中の事業を切り替える。
 *
 * クライアントから渡されるbusinessIdは一切信用せず、必ず
 * getUserBusinesses()(RLSで「自分のbusinesses」だけに絞り込まれた結果)に
 * 含まれる場合のみCookieへ反映する。含まれていなければ、他ユーザーの
 * business_idであるか存在しないIDであり、Cookieは変更せずエラーを返す。
 */
export async function switchBusiness(businessId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  if (!businessId) {
    return { error: "事業を選択してください。" };
  }

  const businesses = await getUserBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target) {
    return { error: "指定された事業が見つかりませんでした。" };
  }

  await setCurrentBusinessCookie(target.id);

  // Dashboard/Ideas/Tasks/Finance/Goals/CoachはすべてこのlayoutのCookieの下にあるため、
  // layout単位で再検証すればアプリ全体が新しい選択事業のデータで更新される。
  revalidatePath("/", "layout");

  return { error: null };
}

/**
 * 現在選択中の事業を削除する。
 *
 * business_idはクライアントから一切受け取らず、常にgetCurrentBusiness()
 * (Cookie+RLSで検証済み)で対象を解決する。誤操作防止のため、呼び出し元
 * (DeleteBusinessModal)でクライアント側の事業名一致チェックを行っているが、
 * ここでもconfirmNameが実際の事業名と完全一致することをサーバー側で
 * 必ず再検証してから削除する(クライアント側チェックのバイパスに対する防御)。
 *
 * businesses行の削除はDBのON DELETE CASCADE設定により、紐づく
 * business_ideas/tasks/goals/sales/expenses/coach_messagesも
 * 自動的に完全削除される(既存スキーマの仕様。ここでは変更しない)。
 *
 * 削除後、存在しないbusiness_idがCookieに残らないよう、残存事業があれば
 * その先頭(作成日時が最も古いもの)へ切り替え、無ければCookieを削除する。
 */
export async function deleteBusiness(confirmName: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "削除対象の事業が見つかりませんでした。" };
  }

  if (confirmName !== business.name) {
    return { error: "入力された事業名が一致しません。正確に入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").delete().eq("id", business.id);

  if (error) {
    console.error("deleteBusiness failed", error);
    return { error: "事業の削除に失敗しました。時間をおいて再度お試しください。" };
  }

  const remaining = await getUserBusinesses();
  if (remaining.length > 0) {
    await setCurrentBusinessCookie(remaining[0].id);
  } else {
    await clearCurrentBusinessCookie();
  }

  // businesses 0件になった場合、(main)/layout.tsxが次の描画で自動的に
  // /onboarding へリダイレクトする(既存の初回設定フローをそのまま利用)。
  revalidatePath("/", "layout");

  return { error: null };
}
