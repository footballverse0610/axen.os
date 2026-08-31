"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Bar } from "@/components/ui/Bar";
import { OptionCard } from "@/components/welcome/OnboardingWizard";
import {
  START_BLOCKER_OPTIONS,
  START_STATE_OPTIONS,
  START_WANT_OPTIONS,
  suggestStartStateFromBusinessStage,
  type StartBlocker,
  type StartState,
  type StartWant,
} from "@/lib/start-guide";
import type { BusinessStage } from "@/lib/supabase/types";
import { StartGuideResult } from "./StartGuideResult";

const TOTAL_QUESTIONS = 3;

export function StartGuideWizard({
  businessStage,
  industry,
}: {
  businessStage: BusinessStage;
  industry: string | null;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<StartState | "">(
    suggestStartStateFromBusinessStage(businessStage) ?? "",
  );
  const [want, setWant] = useState<StartWant | "">("");
  const [wantOther, setWantOther] = useState("");
  const [blocker, setBlocker] = useState<StartBlocker | "">("");
  const [blockerOther, setBlockerOther] = useState("");

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return state !== "";
      case 1:
        return want !== "" && (want !== "other" || wantOther.trim().length > 0);
      case 2:
        return blocker !== "" && (blocker !== "other" || blockerOther.trim().length > 0);
      default:
        return true;
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    if (!canProceed()) return;
    setStep((s) => Math.min(TOTAL_QUESTIONS, s + 1));
  }

  if (step === TOTAL_QUESTIONS) {
    return (
      <StartGuideResult
        answers={{
          state: state as StartState,
          want: want as StartWant,
          wantOther,
          blocker: blocker as StartBlocker,
          blockerOther,
        }}
        industry={industry}
        onRestart={() => setStep(0)}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>起業スタート診断</span>
          <span>
            {step + 1} / {TOTAL_QUESTIONS}
          </span>
        </div>
        <Bar value={step + 1} max={TOTAL_QUESTIONS} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {step === 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">今の状態は？</legend>
            {START_STATE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={state === option.value}
                onClick={() => setState(option.value)}
              />
            ))}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              どんなことをしたい？
            </legend>
            {START_WANT_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={want === option.value}
                onClick={() => setWant(option.value)}
              />
            ))}
            {want === "other" ? (
              <input
                type="text"
                value={wantOther}
                onChange={(e) => setWantOther(e.target.value)}
                maxLength={100}
                placeholder="やりたいことを入力してください"
                className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            ) : null}
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              今、一番困っていることは？
            </legend>
            {START_BLOCKER_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={blocker === option.value}
                onClick={() => setBlocker(option.value)}
              />
            ))}
            {blocker === "other" ? (
              <input
                type="text"
                value={blockerOther}
                onChange={(e) => setBlockerOther(e.target.value)}
                maxLength={100}
                placeholder="困っていることを入力してください"
                className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            ) : null}
          </fieldset>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="戻る"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-surface-muted"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
