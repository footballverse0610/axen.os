"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { GoalForm } from "@/components/goals/GoalForm";
import { quickAddTask } from "@/lib/supabase/task-actions";
import {
  buildStartGuideAiPrompt,
  getStartGuideRecommendation,
  type StartGuideAnswers,
  type StartGuideStep,
} from "@/lib/start-guide";

export function StartGuideResult({
  answers,
  industry,
  onRestart,
}: {
  answers: StartGuideAnswers;
  industry: string | null;
  onRestart: () => void;
}) {
  const recommendation = getStartGuideRecommendation(answers);
  const aiPrompt = buildStartGuideAiPrompt(answers, industry);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs font-medium text-muted-foreground">あなたが今やるべきこと</p>
        <p className="mt-1.5 text-lg font-semibold leading-relaxed text-foreground">
          {recommendation.headline}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {recommendation.steps.map((step, index) => (
          <StartGuideStepCard key={step.title} index={index} step={step} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface-muted/60 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
            <Sparkles className="h-4 w-4 text-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">まだ何をすればいいか分からない？</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              選んだ内容をもとに、AIコーチが具体的にやることを提案します。
            </p>
            <Link
              href={`/coach?prompt=${encodeURIComponent(aiPrompt)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground"
            >
              AIに相談する
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        最初からやり直す
      </button>
    </div>
  );
}

function StartGuideStepCard({ index, step }: { index: number; step: StartGuideStep }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalCreated, setGoalCreated] = useState(false);

  function handleAddTask() {
    setError(null);
    startTransition(async () => {
      const result = await quickAddTask(step.taskTitle, step.taskCategory);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAdded(true);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-base">
          <span aria-hidden>{step.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">STEP {index + 1}</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{step.title}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddTask}
              disabled={isPending || added}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                added
                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "bg-foreground text-background hover:opacity-90 disabled:opacity-60"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Taskに追加しました
                </>
              ) : isPending ? (
                "追加中…"
              ) : (
                "Taskに追加"
              )}
            </button>

            {step.goal ? (
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                disabled={goalCreated}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {goalCreated ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Goalを作成しました
                  </>
                ) : (
                  "Goalを作成"
                )}
              </button>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {showGoalModal && step.goal ? (
        <Modal title="Goalを作成" onClose={() => setShowGoalModal(false)}>
          <GoalForm
            initialValues={{
              title: step.goal.title,
              goalType: step.goal.goalType,
              unit: step.goal.unit,
              targetValue: step.goal.targetValue,
            }}
            onDone={() => {
              setShowGoalModal(false);
              setGoalCreated(true);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
