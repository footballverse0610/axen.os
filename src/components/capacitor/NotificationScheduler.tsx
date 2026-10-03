"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { getNotificationScheduleData } from "@/lib/supabase/notification-actions";
import { rescheduleReminders } from "@/lib/capacitor/notifications";

/**
 * アプリ起動時(このレイアウトのマウント時)に、タスク/目標のリマインダー
 * 通知を現在のデータに合わせて再スケジュールする。
 *
 * - Capacitor.isNativePlatform()がfalseの場合(Web版)は何もしない
 * - 通知設定(ON/OFF・時刻)はサーバー(profiles)から取得するため、
 *   設定変更はNotificationSettingsForm側で即座に反映(そちらでも
 *   rescheduleRemindersを呼ぶ)、ここはアプリ起動時点のデータで
 *   予約し直す役割
 * - due_date/target_dateの変更(タスク・目標の作成/編集/完了)は
 *   次回アプリ起動時に反映される(起動のたびにこのeffectが
 *   最新データを取得して積み直すため)
 */
export function NotificationScheduler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    (async () => {
      const data = await getNotificationScheduleData();
      // enabled/disabledいずれの場合もrescheduleReminders側で処理する
      // (OFFなら内部でcancelAllRemindersのみ行われ、古い予約が残らない)。
      await rescheduleReminders(data);
    })();
  }, []);

  return null;
}
