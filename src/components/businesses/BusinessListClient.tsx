"use client";

import { ArrowLeft, Check, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { DeleteBusinessModal } from "@/components/layout/DeleteBusinessModal";
import { switchBusiness } from "@/lib/supabase/business-actions";
import type { Business } from "@/lib/supabase/types";

/**
 * 事業切り替え専用ページ。
 *
 * 以前はモーダル(オーバーレイ+固定高さのパネル)内で一覧を表示していたが、
 * iOS Safariの実機検証で「一覧が画面上部に見切れる」症状がvh/dvh/
 * visualViewport.heightのいずれを使っても再発したため、モーダル自体を
 * 廃止した。ここでは通常のページとして一覧を描画し、ページ全体を
 * ブラウザ標準のスクロールに任せる(特別なスクロールコンテナ・
 * fixed overlay・body.style.overflowの操作は一切行わない)。
 *
 * 事業の切り替え自体は既存のswitchBusiness() Server Action
 * (Cookie更新 + revalidatePath("/", "layout"))をそのまま再利用する。
 * 編集・削除も既存のOnboardingForm/DeleteBusinessModalをそのまま再利用する
 * (これらは短い1件のフォーム/確認ダイアログであり、一覧の見切れ問題とは
 * 無関係だったため変更していない)。
 */
type View = "list" | "create" | "edit";

export function BusinessListClient({
  businesses,
  currentBusiness,
}: {
  businesses: Business[];
  currentBusiness: Business;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(business: Business) {
    if (business.id === currentBusiness.id) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchBusiness(business.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
    });
  }

  if (view === "create") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          戻る
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            新しい事業を追加
          </h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <OnboardingForm submitLabel="追加する" />
        </div>
      </div>
    );
  }

  if (view === "edit") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          戻る
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">事業を編集</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <OnboardingForm
            business={currentBusiness}
            submitLabel="変更を保存"
            onDone={() => setView("list")}
          />
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
            >
              この事業を削除する
            </button>
          </div>
        </div>

        {showDeleteModal ? (
          <DeleteBusinessModal
            business={currentBusiness}
            onClose={() => setShowDeleteModal(false)}
            onDeleted={() => {
              setShowDeleteModal(false);
              router.push("/");
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        戻る
      </button>

      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          事業を切り替える
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          切り替えたい事業をタップしてください。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {businesses.map((business) => {
          const isCurrent = business.id === currentBusiness.id;
          return (
            <div
              key={business.id}
              className={`flex items-center gap-1 rounded-2xl border pr-2 transition-colors ${
                isCurrent
                  ? "border-foreground/30 bg-surface-muted"
                  : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(business)}
                className={`min-w-0 flex-1 rounded-2xl px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCurrent ? "" : "hover:bg-surface-muted"
                }`}
              >
                <span className="block truncate text-base font-medium text-foreground">
                  {business.name}
                </span>
                {business.one_liner ? (
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {business.one_liner}
                  </span>
                ) : null}
              </button>
              {isCurrent ? (
                <>
                  <button
                    type="button"
                    aria-label="現在の事業を編集"
                    onClick={() => setView("edit")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <Check className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setView("create")}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden />
        新しい事業を追加
      </button>
    </div>
  );
}
