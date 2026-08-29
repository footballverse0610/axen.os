"use client";

import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { switchBusiness } from "@/lib/supabase/business-actions";
import type { Business } from "@/lib/supabase/types";

type ModalView = "closed" | "list" | "create";

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
          <div className="flex flex-col gap-1">
            {businesses.map((business) => {
              const isCurrent = business.id === currentBusiness.id;
              return (
                <button
                  key={business.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSelect(business.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isCurrent
                      ? "bg-surface-muted text-foreground"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  <span className="min-w-0 truncate font-medium">{business.name}</span>
                  {isCurrent ? (
                    <Check className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                  ) : null}
                </button>
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
    </>
  );
}
