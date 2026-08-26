"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-items";

export function Header() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {current?.label ?? "Founder"}
      </h1>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-muted-foreground"
        aria-hidden
      >
        自
      </div>
    </header>
  );
}
