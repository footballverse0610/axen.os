"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  updateNotificationPreferences,
  getNotificationScheduleData,
  type NotificationActionState,
} from "@/lib/supabase/notification-actions";
import {
  requestNotificationPermission,
  rescheduleReminders,
} from "@/lib/capacitor/notifications";
import type { Profile } from "@/lib/supabase/types";

const initialState: NotificationActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * タスク/目標期限のローカル通知(Android)のON/OFF・通知時刻を設定するフォーム。
 *
 * 保存自体(updateNotificationPreferences)はWeb/Androidどちらでも行える
 * (単なるprofilesの設定値)。保存が成功した後、Androidネイティブ環境でのみ
 * 通知権限の確認・端末への再スケジュール(rescheduleReminders)を行う
 * (Web版では保存のみで端末側の動作は発生しない)。
 */
export function NotificationSettingsForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, isPending] = useActionState(updateNotificationPreferences, initialState);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // 同じ保存結果(successがtrueのまま)に対して、再スケジュール処理を
  // 二重実行しないためのガード。
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    if (!state.success) {
      handledSuccessRef.current = false;
      return;
    }
    if (handledSuccessRef.current || !Capacitor.isNativePlatform()) {
      return;
    }
    handledSuccessRef.current = true;

    (async () => {
      const data = await getNotificationScheduleData();
      if (data.enabled) {
        const granted = await requestNotificationPermission();
        setPermissionDenied(!granted);
      } else {
        setPermissionDenied(false);
      }
      await rescheduleReminders(data);
    })();
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">タスク・目標のリマインダー</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            期限が近いタスク・目標を、指定した時刻に端末へ通知します(Android版のみ)。
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="notificationsEnabled"
            defaultChecked={profile?.notifications_enabled ?? false}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-surface-muted transition-colors peer-checked:bg-primary" />
          <div className="absolute left-1 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notificationTime" className="text-xs font-medium text-muted-foreground">
          通知時刻
        </label>
        <input
          id="notificationTime"
          name="notificationTime"
          type="time"
          defaultValue={(profile?.notification_time ?? "09:00:00").slice(0, 5)}
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-green-400">保存しました。</p> : null}
      {permissionDenied ? (
        <p className="text-sm text-amber-400">
          端末の通知が許可されていないため、通知は届きません。Androidの設定アプリから
          「起業しよ。」の通知を許可してください。
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:self-start sm:px-6"
      >
        {isPending ? "保存中…" : "通知設定を保存"}
      </button>
    </form>
  );
}
