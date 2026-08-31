"use client";

import { ArrowLeftRight, Building2 } from "lucide-react";
import Link from "next/link";
import type { Business } from "@/lib/supabase/types";

/**
 * ヘッダーに常時表示する、現在の事業名(非インタラクティブ)と
 * 「事業を切り替える」への導線。
 *
 * 以前はここでモーダルを開いて一覧・追加・編集・削除を行っていたが、
 * 一覧表示がiOS Safariで見切れる問題が解決しなかったため、一覧・追加・
 * 編集・削除は専用ページ(/businesses、src/components/businesses/
 * BusinessListClient.tsx)に移した。このコンポーネントは単純な
 * 現在事業名の表示とページ遷移リンクのみを担う。
 */
export function BusinessSwitcher({ currentBusiness }: { currentBusiness: Business }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground">
        <Building2 className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{currentBusiness.name}</span>
      </span>
      <Link
        href="/businesses"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
      >
        <ArrowLeftRight className="h-3 w-3 shrink-0" aria-hidden />
        事業を切り替える
      </Link>
    </div>
  );
}
