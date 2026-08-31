"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-items";
import { logout } from "@/lib/supabase/actions";
import { BusinessSwitcher } from "./BusinessSwitcher";
import type { Business } from "@/lib/supabase/types";

export function Header({
  userEmail,
  businesses,
  currentBusiness,
}: {
  userEmail: string | null;
  businesses: Business[];
  currentBusiness: Business;
}) {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  // TEMP DEBUG(調査用、原因特定後に削除する)。Client Componentのため
  // ブラウザ側のコンソールに出力される(サーバーのFunction Logsではない)。
  console.log("[DEBUG Header]", {
    businessesCount: businesses.length,
    businessNames: businesses.map((b) => b.name),
    currentBusinessId: currentBusiness.id,
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8 md:py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <BusinessSwitcher businesses={businesses} currentBusiness={currentBusiness} />
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
          {current?.label ?? "起業しよ。"}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/settings"
          aria-label="設定"
          title={userEmail ?? "設定"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {initial}
        </Link>
        <form action={logout}>
          <button
            type="submit"
            aria-label="ログアウト"
            title="ログアウト"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </header>
  );
}
