"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    // モーダル表示中は背景ページ側のスクロールを止める。iOS Safariでは
    // 内部スクロール領域が端まで達すると背面のページへスクロールが
    // 伝播すること(ラバーバンド)があるため、それも合わせて防ぐ。
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 backdrop-blur-sm sm:items-center"
      style={{
        // 100vh/85vhはiOS Safariのツールバー(アドレスバー)の表示状態により
        // 実際に見えている範囲より大きく計算されることがあり、それが今回の
        // 「モーダル上部が画面外に見切れる」原因だった。dvh(dynamic viewport
        // height)は今見えている範囲を基準に再計算されるため、この問題が起きない。
        // 併せてセーフエリア(ノッチ/ホームインジケーター)分の余白も確保する。
        paddingTop: "max(2rem, calc(env(safe-area-inset-top) + 1rem))",
        paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      }}
    >
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex max-h-[80dvh] w-full max-w-sm flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex shrink-0 items-center justify-between px-6 pt-6">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
