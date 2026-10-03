import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotificationScheduleData } from "@/lib/supabase/notification-actions";

/**
 * UUID文字列を、@capacitor/local-notificationsが要求する32bit符号付き整数の
 * 通知IDへ決定的に変換する(FNV-1a)。同じタスク/目標IDからは常に同じIDに
 * なるため、再スケジュール時もidの一貫性が保たれる
 * (実際の重複防止はcancelAll()で毎回全消去してから積み直す方式のため、
 * ここでの衝突は実害がない=万一ハッシュが衝突しても片方が上書きされるだけ)。
 */
function hashToNotificationId(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // 32bit符号付き範囲内の正の値に収める。
  return hash >>> 1;
}

/** "YYYY-MM-DD" + "HH:MM" を端末ローカル時刻のDateに変換する。 */
function toLocalDate(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0, 0);
}

/**
 * 通知権限を確認し、未許可なら要求する。
 * Capacitor.isNativePlatform()がfalseの場合(Web版)は常にfalseを返し、
 * 何も要求しない。
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") {
      return true;
    }
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  } catch (err) {
    console.error("requestNotificationPermission failed", err);
    return false;
  }
}

/**
 * このアプリが管理するローカル通知をすべて取り消す。
 * ログアウト時(別ユーザーの通知を残さないため)と、再スケジュール前
 * (重複登録を防ぐため)の両方から呼ばれる。
 */
export async function cancelAllReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await LocalNotifications.cancelAll();
  } catch (err) {
    console.error("cancelAllReminders failed", err);
  }
}

/**
 * タスク/目標のリマインダー通知を、現在のデータに合わせて再スケジュールする。
 * 既存の予約をすべて取り消してから積み直すため、何度呼んでも重複しない。
 *
 * - 通知OFF、または通知権限が未許可の場合は取り消すだけで何も積まない
 * - 期限日の時刻が既に過去の場合はスキップする(過去時刻を予約すると
 *   即座に発火する可能性があるため)
 * - 発火時刻は「ユーザーが設定した時刻」を期限日(due_date/target_date)に
 *   適用した、端末ローカル時刻
 */
export async function rescheduleReminders(data: NotificationScheduleData): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await cancelAllReminders();

  if (!data.enabled) {
    return;
  }

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") {
    return;
  }

  const now = Date.now();
  const notifications = [
    ...data.taskReminders.map((t) => ({
      kind: "task" as const,
      id: `task:${t.id}`,
      title: "タスクの期限です",
      body: t.title,
      at: toLocalDate(t.date, data.time),
    })),
    ...data.goalReminders.map((g) => ({
      kind: "goal" as const,
      id: `goal:${g.id}`,
      title: "目標の期限です",
      body: g.title,
      at: toLocalDate(g.date, data.time),
    })),
  ]
    .filter((n): n is typeof n & { at: Date } => n.at !== null && n.at.getTime() > now)
    .map((n) => ({
      id: hashToNotificationId(n.id),
      title: n.title,
      body: n.body,
      schedule: { at: n.at, allowWhileIdle: true },
      isExactNotification: false,
    }));

  if (notifications.length === 0) {
    return;
  }

  try {
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    console.error("rescheduleReminders failed", err);
  }
}
