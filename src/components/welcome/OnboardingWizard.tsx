"use client";

import { useState, useTransition } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Bar } from "@/components/ui/Bar";
import { saveOnboardingProfile } from "@/lib/supabase/onboarding-actions";
import {
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
  GOAL_PERIOD_OPTIONS,
  INDUSTRY_OPTIONS,
  OTHER_INDUSTRY_VALUE,
  STARTUP_STAGE_OPTIONS,
  WEEKLY_TIME_OPTIONS,
} from "@/lib/onboarding-options";

type StepId =
  | "intro"
  | "stage"
  | "business"
  | "challenges"
  | "goal"
  | "time"
  | "budget"
  | "done";

/** stage/budgetは「まだアイデアがない」を選ぶとスキップする(事業の詳細・予算は
 * アイデアが固まってから聞く方が自然なため)。動的にステップが変わるため、
 * 配列のインデックスではなくstepId同士の遷移関数で前後を管理する。
 */
function nextStepId(current: StepId, startupStage: string): StepId {
  const skipsBusinessAndBudget = startupStage === "idea_none";
  switch (current) {
    case "intro":
      return "stage";
    case "stage":
      return skipsBusinessAndBudget ? "challenges" : "business";
    case "business":
      return "challenges";
    case "challenges":
      return "goal";
    case "goal":
      return "time";
    case "time":
      return skipsBusinessAndBudget ? "done" : "budget";
    case "budget":
      return "done";
    case "done":
      return "done";
  }
}

function prevStepId(current: StepId, startupStage: string): StepId {
  const skipsBusinessAndBudget = startupStage === "idea_none";
  switch (current) {
    case "stage":
      return "intro";
    case "business":
      return "stage";
    case "challenges":
      return skipsBusinessAndBudget ? "stage" : "business";
    case "goal":
      return "challenges";
    case "time":
      return "goal";
    case "budget":
      return "time";
    case "done":
      return skipsBusinessAndBudget ? "time" : "budget";
    case "intro":
      return "intro";
  }
}

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

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

export function OnboardingWizard() {
  const [stepId, setStepId] = useState<StepId>("intro");
  const [startupStage, setStartupStage] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessOneLiner, setBusinessOneLiner] = useState("");
  const [industrySelect, setIndustrySelect] = useState("");
  const [industryOther, setIndustryOther] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [goalAmount, setGoalAmount] = useState("");
  const [goalPeriodMonths, setGoalPeriodMonths] = useState("");
  const [weeklyTime, setWeeklyTime] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isOtherIndustry = industrySelect === OTHER_INDUSTRY_VALUE;
  const industryValue = isOtherIndustry ? industryOther.trim() : industrySelect;

  const skipsBusinessAndBudget = startupStage === "idea_none";
  const countedSteps: StepId[] = skipsBusinessAndBudget
    ? ["stage", "challenges", "goal", "time"]
    : ["stage", "business", "challenges", "goal", "time", "budget"];
  const countedIndex = countedSteps.indexOf(stepId);

  function canProceed(): boolean {
    switch (stepId) {
      case "intro":
        return true;
      case "stage":
        return startupStage !== "";
      case "business":
        return true;
      case "challenges":
        return challenges.length > 0;
      case "goal":
        if (!goalAmount) return true;
        return Number(goalAmount) > 0 && goalPeriodMonths !== "";
      case "time":
        return weeklyTime !== "";
      case "budget":
        return true;
      case "done":
        return true;
    }
  }

  function handleBack() {
    setError(null);
    setStepId((s) => prevStepId(s, startupStage));
  }

  function handleSelectStage(value: string) {
    setStartupStage(value);
    // 「まだアイデアがない」を選んだ場合、Q3の初期選択として「アイデア」を
    // 事前にチェックしておく(まだ本人の手で選び直していない場合のみ)。
    if (value === "idea_none" && challenges.length === 0) {
      setChallenges(["アイデア"]);
    }
  }

  function handleSkipGoal() {
    setGoalAmount("");
    setGoalPeriodMonths("");
    setStepId(nextStepId("goal", startupStage));
  }

  function handleNext() {
    if (!canProceed()) return;
    setError(null);

    if (stepId === "done") {
      startTransition(async () => {
        const result = await saveOnboardingProfile({
          startupStage,
          businessName,
          businessOneLiner,
          businessIndustry: industryValue,
          challenges,
          weeklyTime,
          budgetRange,
          goalAmount,
          goalPeriodMonths,
        });
        // 成功時はsaveOnboardingProfile内でredirect("/")される。
        // ここに到達するのはエラー時のみ。
        if (result.error) {
          setError(result.error);
        }
      });
      return;
    }

    setStepId((s) => nextStepId(s, startupStage));
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {countedIndex >= 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              STEP {countedIndex + 1} / {countedSteps.length}
            </span>
          </div>
          <Bar value={countedIndex + 1} max={countedSteps.length} />
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-6">
        {stepId === "intro" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              起業しよ。へようこそ
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              いくつか質問に答えるだけで、あなた専用のAI起業コーチが始まります。
            </p>
          </div>
        ) : null}

        {stepId === "stage" ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              今の起業ステージは？
            </legend>
            {STARTUP_STAGE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={startupStage === option.value}
                onClick={() => handleSelectStage(option.value)}
              />
            ))}
          </fieldset>
        ) : null}

        {stepId === "business" ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">
                あなたの事業について教えてください
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                すべて任意です。あとからいつでも変更できます。
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="businessName" className="text-xs font-medium text-muted-foreground">
                事業名（任意）
              </label>
              <input
                id="businessName"
                type="text"
                maxLength={100}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={fieldClass}
                placeholder="例：〇〇カフェ（決まっていなくてもOK）"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="businessOneLiner"
                className="text-xs font-medium text-muted-foreground"
              >
                どんな事業？（任意）
              </label>
              <textarea
                id="businessOneLiner"
                maxLength={200}
                rows={3}
                value={businessOneLiner}
                onChange={(e) => setBusinessOneLiner(e.target.value)}
                className={fieldClass}
                placeholder="一言で説明すると？"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="industry" className="text-xs font-medium text-muted-foreground">
                業種（任意）
              </label>
              <select
                id="industry"
                value={industrySelect}
                onChange={(e) => setIndustrySelect(e.target.value)}
                className={fieldClass}
              >
                <option value="">選択してください</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value={OTHER_INDUSTRY_VALUE}>その他（自由入力）</option>
              </select>
              {isOtherIndustry ? (
                <input
                  type="text"
                  maxLength={50}
                  value={industryOther}
                  onChange={(e) => setIndustryOther(e.target.value)}
                  className={fieldClass}
                  placeholder="業種を入力してください"
                  aria-label="業種（自由入力）"
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {stepId === "challenges" ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              今、一番の課題は？
            </legend>
            <p className="mb-1 text-xs text-muted-foreground">複数選択できます</p>
            {CHALLENGE_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={challenges.includes(option)}
                onClick={() => setChallenges((prev) => toggleValue(prev, option))}
              />
            ))}
          </fieldset>
        ) : null}

        {stepId === "goal" ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">売上目標はありますか？</p>
              <p className="mt-1 text-xs text-muted-foreground">
                まだ決めていなければスキップできます。
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="goalAmount" className="text-xs font-medium text-muted-foreground">
                目標金額（円）
              </label>
              <input
                id="goalAmount"
                type="number"
                inputMode="numeric"
                min={1}
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className={fieldClass}
                placeholder="例：300000"
              />
            </div>

            {goalAmount ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground">期間</span>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_PERIOD_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.value}
                      label={option.label}
                      selected={goalPeriodMonths === option.value}
                      onClick={() => setGoalPeriodMonths(option.value)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSkipGoal}
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              まだ決めていない（スキップ）
            </button>
          </div>
        ) : null}

        {stepId === "time" ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              起業に使える時間は？
            </legend>
            {WEEKLY_TIME_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={weeklyTime === option.value}
                onClick={() => setWeeklyTime(option.value)}
              />
            ))}
          </fieldset>
        ) : null}

        {stepId === "budget" ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-base font-semibold text-foreground">
              初期予算は？
            </legend>
            <p className="mb-1 text-xs text-muted-foreground">任意です</p>
            {BUDGET_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={budgetRange === option}
                onClick={() => setBudgetRange((prev) => (prev === option ? "" : option))}
              />
            ))}
          </fieldset>
        ) : null}

        {stepId === "done" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {skipsBusinessAndBudget
                ? "これからAIと一緒にアイデアを考えましょう。"
                : "AIコーチがあなたの事業をサポートします。"}
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
        {stepId !== "intro" ? (
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
            : stepId === "intro"
              ? "始める"
              : stepId === "done"
                ? "AIコーチを始める"
                : "次へ"}
        </button>
      </div>
    </div>
  );
}
