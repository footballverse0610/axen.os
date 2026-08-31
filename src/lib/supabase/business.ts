import "server-only";
import { cookies } from "next/headers";
import { createClient } from "./server";
import type { Business } from "./types";

/** 「選択中business_id」を保持するCookie名 */
export const CURRENT_BUSINESS_COOKIE = "current_business_id";

/**
 * ログイン中ユーザーが所有する事業を作成日時の昇順で取得する。
 * business_id/user_idを引数で受け取らない設計にしているのは、
 * 「他ユーザーのbusiness_idを渡されて操作する」経路を作らないため。
 * 常にRLS(businesses.user_id = auth.uid())が絞り込みを行う。
 */
export async function getUserBusinesses(): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUserBusinesses failed", error);
    return [];
  }

  return data ?? [];
}

/**
 * Cookieに保存された「選択中business_id」の生値を返す。
 * この値はクライアント(ブラウザ)が送ってくるものであり、それ単体では
 * 信用しない。必ずgetUserBusinesses()(RLSで絞り込まれた自分のbusinesses)
 * に含まれるかを照合してから使うこと(getCurrentBusiness参照)。
 */
async function getSelectedBusinessIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CURRENT_BUSINESS_COOKIE)?.value ?? null;
}

/**
 * 「現在選択中の事業」を返す。
 * Cookieに選択中business_idがあり、それが自分のbusinesses一覧に実在すれば
 * それを返す。無い/不正(他ユーザーのIDや存在しないID)であれば、
 * 従来通り最初に作成した事業にフォールバックする。
 *
 * 呼び出し側は引数なしで呼べば従来と同じ挙動になる(後方互換)。
 * layout.tsxなど、既にgetUserBusinesses()を呼び済みの場所からは
 * その結果を渡すことで、DBへの重複問い合わせを避けられる。
 */
export async function getCurrentBusiness(preloadedBusinesses?: Business[]): Promise<Business | null> {
  const businesses = preloadedBusinesses ?? (await getUserBusinesses());
  if (businesses.length === 0) {
    return null;
  }

  const selectedId = await getSelectedBusinessIdFromCookie();
  if (selectedId) {
    const selected = businesses.find((b) => b.id === selectedId);
    if (selected) {
      return selected;
    }
  }

  return businesses[0];
}

/**
 * 選択中business_idをCookieへ保存する。
 * 呼び出し元(Server Action)が、事前にbusinessIdが「現在ログイン中ユーザー
 * 自身のbusinesses」に含まれることを確認済みであることが前提
 * (このファイル内ではuser_idとの一致チェックは行わない)。
 * Server Function/Route Handler内でのみ呼び出し可能(cookies().setの制約)。
 */
export async function setCurrentBusinessCookie(businessId: string): Promise<void> {
  const store = await cookies();
  store.set(CURRENT_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * 選択中business_idのCookieを削除する。
 * 事業削除後、存在しないbusiness_idがCookieに残り続けないようにするために使う
 * (削除後に残存事業がある場合はsetCurrentBusinessCookieで新しい事業に
 * 切り替える。無い場合はこちらでCookie自体を消す)。
 */
export async function clearCurrentBusinessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CURRENT_BUSINESS_COOKIE);
}
