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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:pb-16">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-surface shadow-2xl">
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
        <div className="mt-4 min-h-0 overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
