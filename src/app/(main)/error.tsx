"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 詳細なエラー内容はサーバー/コンソールログのみに残し、画面には出さない
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Card className="flex max-w-sm flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-foreground">
          データの読み込み中に問題が発生しました
        </p>
        <p className="text-sm text-muted-foreground">
          しばらくしてから、もう一度お試しください。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          再読み込み
        </button>
      </Card>
    </div>
  );
}
