"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/supabase/actions";
import { cancelAllReminders } from "@/lib/capacitor/notifications";

/**
 * Settingsページ用のログアウトボタン。Header.tsxのhandleLogoutと同じ理由で、
 * ログアウト前に端末のローカル通知をすべて取り消してから
 * (別ユーザーの通知が残らないように)logout()を呼ぶ。
 */
export function LogoutButton() {
  async function handleLogout() {
    await cancelAllReminders();
    await logout();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      ログアウト
    </button>
  );
}
