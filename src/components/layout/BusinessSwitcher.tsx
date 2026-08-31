"use client";

import { Building2, Check, ChevronDown, Pencil, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { DeleteBusinessModal } from "./DeleteBusinessModal";
import { switchBusiness } from "@/lib/supabase/business-actions";
import type { Business } from "@/lib/supabase/types";

type ModalView = "closed" | "list" | "create" | "edit" | "delete";

export function BusinessSwitcher({
  businesses,
  currentBusiness,
}: {
  businesses: Business[];
  currentBusiness: Business;
}) {
  const [view, setView] = useState<ModalView>("closed");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // TEMP DEBUG(調査用、原因特定後に削除する)。ブラウザ側のコンソールに出力される。
  console.log("[DEBUG BusinessSwitcher]", {
    businessesCount: businesses.length,
    businessNames: businesses.map((b) => b.name),
    currentBusinessId: currentBusiness.id,
  });

  function handleSelect(businessId: string) {
    if (businessId === currentBusiness.id) {
      setView("closed");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchBusiness(businessId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setView("closed");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setView("list")}
        className="flex max-w-[180px] items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Building2 className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{currentBusiness.name}</span>
        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
      </button>

      {view === "list" ? (
        <Modal title="事業を切り替え" onClose={() => setView("closed")}>
          {/* TEMP DEBUG(調査用、原因特定後に削除する)。画面上に直接件数を表示する。 */}
          <p className="mb-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] text-amber-500">
            [DEBUG] businesses.length = {businesses.length} / names:{" "}
            {businesses.map((b) => b.name).join(", ") || "(空)"}
          </p>
          <div className="flex flex-col gap-1">
            {businesses.map((business) => {
              const isCurrent = business.id === currentBusiness.id;
              return (
                <div
                  key={business.id}
                  className={`flex items-center gap-1 rounded-xl pr-1.5 text-sm transition-colors ${
                    isCurrent ? "bg-surface-muted text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSelect(business.id)}
                    className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isCurrent ? "" : "hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    <span className="block truncate">{business.name}</span>
                  </button>
                  {isCurrent ? (
                    <>
                      <button
                        type="button"
                        aria-label="現在の事業を編集"
                        onClick={() => setView("edit")}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <Check className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setView("create")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden />
            事業を追加
          </button>
        </Modal>
      ) : null}

      {view === "create" ? (
        <Modal title="事業を追加" onClose={() => setView("closed")}>
          <OnboardingForm submitLabel="追加する" />
        </Modal>
      ) : null}

      {view === "edit" ? (
        <Modal title="事業を編集" onClose={() => setView("closed")}>
          <OnboardingForm
            business={currentBusiness}
            submitLabel="変更を保存"
            onDone={() => setView("closed")}
          />
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setView("delete")}
              className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
            >
              この事業を削除する
            </button>
          </div>
        </Modal>
      ) : null}

      {view === "delete" ? (
        <DeleteBusinessModal
          business={currentBusiness}
          onClose={() => setView("edit")}
          onDeleted={() => setView("closed")}
        />
      ) : null}
    </>
  );
}
