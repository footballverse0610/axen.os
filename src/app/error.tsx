"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

/**
 * (main)/error.tsxと同じパターンのルートレベルのエラーバウンダリ。
 * ログイン・新規登録・オンボーディング・パスワードリセット等、
 * (main)グループ外の全ルートを対象とする(それまでNext.jsの
 * 既定のエラー画面しか無かった)。
 */
export default function RootError({
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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="flex max-w-sm flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-foreground">問題が発生しました</p>
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
    </main>
  );
}
