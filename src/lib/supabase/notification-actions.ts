"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentUser } from "./get-current-user";
import { getCurrentProfile } from "./profile";
import { getBusinessTasks } from "./tasks";
import { getBusinessGoals } from "./goals";

export interface NotificationActionState {
  error: string | null;
  success?: boolean;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateTime(time: string): string | null {
  if (!TIME_PATTERN.test(time)) {
    return "通知時刻の形式が正しくありません。";
  }
  return null;
}

/**
 * ログイン中ユーザー自身のタスク/目標リマインダー通知の設定
 * (ON/OFF・通知時刻)を更新する。
 * user_idはクライアントから受け取らず、必ずgetCurrentUser()由来の値を使う。
 * 保存対象は常に「自分自身のprofiles行」のみ(.eq("id", user.id))であり、
 * RLS(profiles_update_own: auth.uid() = id)が最終防波堤として働く。
 */
export async function updateNotificationPreferences(
  _prevState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const enabled = formData.get("notificationsEnabled") === "on";
  const time = String(formData.get("notificationTime") ?? "").trim();

  const validationError = validateTime(time);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      notifications_enabled: enabled,
      // DB側はtime型("HH:MM:SS")のため秒を補う。
      notification_time: `${time}:00`,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateNotificationPreferences failed", error);
    return { error: "通知設定の保存に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/settings");

  return { error: null, success: true };
}

export interface NotificationScheduleItem {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
}

export interface NotificationScheduleData {
  enabled: boolean;
  /** "HH:MM" */
  time: string;
  taskReminders: NotificationScheduleItem[];
  goalReminders: NotificationScheduleItem[];
}

/**
 * Android端末側でローカル通知を(再)スケジュールするために必要な最小限の
 * データを返す。現在選択中の事業(getCurrentBusiness基準)の、期限日を
 * 持つ未完了タスク・期限日を持つ進行中の目標のみを対象にする
 * (ダッシュボード等、他の画面と同じ「現在の事業」の範囲に揃える)。
 *
 * クライアント(Capacitorのisnative分岐)から直接呼び出される想定の
 * Server Actionのため、ここでも改めてgetCurrentUser()で認証確認を行う。
 */
export async function getNotificationScheduleData(): Promise<NotificationScheduleData> {
  const user = await getCurrentUser();
  if (!user) {
    return { enabled: false, time: "09:00", taskReminders: [], goalReminders: [] };
  }

  const [profile, { tasks }, { goals }] = await Promise.all([
    getCurrentProfile(),
    getBusinessTasks(),
    getBusinessGoals(),
  ]);

  const taskReminders: NotificationScheduleItem[] = tasks
    .filter((t) => !t.done && t.due_date)
    .map((t) => ({ id: t.id, title: t.title, date: t.due_date as string }));

  const goalReminders: NotificationScheduleItem[] = goals
    .filter((g) => g.status === "active" && g.target_date)
    .map((g) => ({ id: g.id, title: g.title, date: g.target_date as string }));

  return {
    enabled: profile?.notifications_enabled ?? false,
    // "HH:MM:SS" -> "HH:MM"
    time: (profile?.notification_time ?? "09:00:00").slice(0, 5),
    taskReminders,
    goalReminders,
  };
}
