"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./get-current-user";
import { getUserBusinesses, setCurrentBusinessCookie } from "./business";

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
