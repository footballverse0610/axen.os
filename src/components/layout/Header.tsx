"use client";

import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-items";
import { logout } from "@/lib/supabase/actions";

export function Header({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {current?.label ?? "起業しよ。"}
      </h1>
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-muted-foreground"
          title={userEmail ?? undefined}
          aria-hidden
        >
          {initial}
        </div>
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
