"use client";

import { useState, useTransition } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Bar } from "@/components/ui/Bar";
import { saveOnboardingProfile } from "@/lib/supabase/onboarding-actions";
import {
  AVAILABLE_TIME_OPTIONS,
  COACH_PREFERENCE_OPTIONS,
  MAIN_GOAL_OPTIONS,
  MAX_THREE_MONTH_GOAL_LENGTH,
  CURRENT_STATE_OPTIONS,
} from "@/lib/onboarding-options";

const TOTAL_STEPS = 7;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** 選択肢を大きなカード型ボタンとして表示する共通パーツ(start-guideの診断でも再利用) */
export function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:bg-surface-muted"
      }`}
    >
      <span>{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
    </button>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState<StepIndex>(0);
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState("");
  const [threeMonthGoal, setThreeMonthGoal] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [coachPreferences, setCoachPreferences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return true;
      case 1:
        return mainGoals.length > 0;
      case 2:
        return currentState !== "";
      case 3:
        return threeMonthGoal.trim().length > 0;
      case 4:
        return availableTime !== "";
      case 5:
        return coachPreferences.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  }

  function handleBack() {
    setError(null);
    setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s));
  }

  function handleNext() {
    if (!canProceed()) return;
    setError(null);

    if (step === 6) {
      startTransition(async () => {
        const result = await saveOnboardingProfile({
          mainGoals,
          currentState,
          threeMonthGoal,
          availableTime,
          coachPreferences,
        });
        // 成功時はsaveOnboardingProfile内でredirect("/")される。
        // ここに到達するのはエラー時のみ。
        if (result.error) {
          setError(result.error);
        }
      });
      return;
    }

    setStep((s) => (s + 1) as StepIndex);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {step > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              STEP {step + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <Bar value={step + 1} max={TOTAL_STEPS} />
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-6">
        {step === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              Axen OSへようこそ
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              あなたの人生を、あなた自身の手で変えていこう。
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              今、一番変えたいことは？
            </legend>
            <p className="mb-1 text-xs text-muted-foreground">複数選択できます</p>
            {MAIN_GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={mainGoals.includes(option)}
                onClick={() => setMainGoals((prev) => toggleValue(prev, option))}
              />
            ))}
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              今の自分に一番近いのは？
            </legend>
            {CURRENT_STATE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={currentState === option.value}
                onClick={() => setCurrentState(option.value)}
              />
            ))}
          </fieldset>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="threeMonthGoal"
              className="text-base font-semibold text-foreground"
            >
              3ヶ月後、どうなっていたい？
            </label>
            <textarea
              id="threeMonthGoal"
              value={threeMonthGoal}
              onChange={(e) => setThreeMonthGoal(e.target.value)}
              maxLength={MAX_THREE_MONTH_GOAL_LENGTH}
              rows={5}
              placeholder="自由に書いてみましょう"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <p className="text-right text-xs text-muted-foreground">
              {threeMonthGoal.length} / {MAX_THREE_MONTH_GOAL_LENGTH}
            </p>
          </div>
        ) : null}

        {step === 4 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              1日にどれくらい時間を使えそう？
            </legend>
            {AVAILABLE_TIME_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={availableTime === option.value}
                onClick={() => setAvailableTime(option.value)}
              />
            ))}
          </fieldset>
        ) : null}

        {step === 5 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              AIコーチに何をしてほしい？
            </legend>
            <p className="mb-1 text-xs text-muted-foreground">複数選択できます</p>
            {COACH_PREFERENCE_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={coachPreferences.includes(option)}
                onClick={() => setCoachPreferences((prev) => toggleValue(prev, option))}
              />
            ))}
          </fieldset>
        ) : null}

        {step === 6 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-xl font-semibold tracking-tight text-foreground">
              あなた専用の人生マップを作成します。
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            aria-label="戻る"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || isPending}
          className="flex-1 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? "作成中…"
            : step === 0
              ? "始める"
              : step === 6
                ? "AIコーチを始める"
                : "次へ"}
        </button>
      </div>
    </div>
  );
}
