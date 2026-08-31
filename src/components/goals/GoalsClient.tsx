"use client";

import { Minus, Plus, Pencil, Target, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { getDisplayGoalStatus, goalStatusLabel, goalStatusTone, goalTypeLabel } from "@/lib/goal-status";
import { calcGoalProgress } from "@/lib/supabase/finance";
import { adjustGoalCurrentValue } from "@/lib/supabase/goal-actions";
import type { Goal } from "@/lib/supabase/types";
import { GoalForm } from "./GoalForm";
import { DeleteGoalModal } from "./DeleteGoalModal";

type ModalState =
  | { type: "create" }
  | { type: "edit"; goal: Goal }
  | { type: "delete"; goal: Goal }
  | null;

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const [modal, setModal] = useState<ModalState>(null);

  const activeGoals = goals.filter((g) => g.status === "active");
  const otherGoals = goals.filter((g) => g.status !== "active");

  if (goals.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
            <Target className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">まだ目標がありません</p>
          <p className="text-sm text-muted-foreground">
            最初の目標を設定してみよう。
          </p>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            目標を追加
          </button>
        </div>

        {modal?.type === "create" ? (
          <Modal title="目標を追加" onClose={() => setModal(null)}>
            <GoalForm onDone={() => setModal(null)} />
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          事業の目標と進捗を管理します。
        </p>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          追加
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          進行中 ({activeGoals.length})
        </h2>
        <div className="flex flex-col gap-3">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setModal({ type: "edit", goal })}
              onDelete={() => setModal({ type: "delete", goal })}
            />
          ))}
          {activeGoals.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              進行中の目標はありません。
            </Card>
          ) : null}
        </div>
      </section>

      {otherGoals.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            終了した目標 ({otherGoals.length})
          </h2>
          <div className="flex flex-col gap-3">
            {otherGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setModal({ type: "edit", goal })}
                onDelete={() => setModal({ type: "delete", goal })}
              />
            ))}
          </div>
        </section>
      ) : null}

      {modal?.type === "create" ? (
        <Modal title="目標を追加" onClose={() => setModal(null)}>
          <GoalForm onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "edit" ? (
        <Modal title="目標を編集" onClose={() => setModal(null)}>
          <GoalForm goal={modal.goal} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteGoalModal goal={modal.goal} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

/** 現在値の保存を、連続した変更が落ち着いてから1回だけ送るまでの待機時間(ms)。 */
const SAVE_DEBOUNCE_MS = 400;
/** 長押し開始から最初のリピートまでの間(単発タップと区別するための遅延)。 */
const HOLD_INITIAL_DELAY_MS = 400;

/** 長押しの経過時間に応じてリピート間隔を短くする(常に+1/-1ずつ)。 */
function getHoldRepeatDelay(elapsedMs: number): number {
  if (elapsedMs < 1500) return 220;
  if (elapsedMs < 3500) return 90;
  return 40;
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // +/-操作・直接入力それぞれの体感速度を優先し、useOptimistic(1操作=1
  // トランジション)ではなく、ローカルstateで即座に表示を更新したうえで
  // 保存はデバウンスして1回にまとめる方式にする(連打・長押しで大量の
  // Server Action呼び出しが競合し、順序が入れ替わって古い値で上書きされる
  // 事態を避けるため)。
  const [displayValue, setDisplayValue] = useState(goal.current_value);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [draftValue, setDraftValue] = useState(String(goal.current_value));
  const [valueError, setValueError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = useRef(0);
  const holdDirectionRef = useRef<1 | -1>(1);
  // setTimeoutのクロージャがdisplayValueの古い値を参照し続けないようにするためのref。
  const displayValueRef = useRef(displayValue);
  displayValueRef.current = displayValue;

  // Finance連携等でサーバー側のcurrent_valueが変わったら追従する。ただし
  // 保存待ちのローカル変更がある間は上書きしない(連打・長押しの途中で
  // 表示が古い値へ戻ってしまうのを防ぐ)。
  useEffect(() => {
    if (!pendingSaveRef.current) {
      setDisplayValue(goal.current_value);
    }
  }, [goal.current_value]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const progress = calcGoalProgress(displayValue, goal.target_value);
  const unit = goal.unit ?? "";
  const isLinked = goal.goal_type !== "custom";
  // +/-・長押し・直接入力で即座に変わるdisplayValueを使うため、保存の
  // デバウンスを待たずに「達成」表示へ切り替わる。
  const displayStatus = getDisplayGoalStatus(displayValue, goal.target_value, goal.status);

  function scheduleSave(value: number) {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      setIsSaving(true);
      adjustGoalCurrentValue(goal.id, value).then((result) => {
        setIsSaving(false);
        pendingSaveRef.current = false;
        if (result.error) {
          setValueError(result.error);
          setDisplayValue(goal.current_value);
        } else {
          setValueError(null);
        }
      });
    }, SAVE_DEBOUNCE_MS);
  }

  /** +1/-1のみを許可する。連打・長押しのどちらもこの関数を繰り返し呼ぶだけ。 */
  function applyDelta(delta: 1 | -1) {
    setDisplayValue((prev) => {
      const next = Math.max(0, prev + delta);
      if (next !== prev) {
        setValueError(null);
        scheduleSave(next);
      }
      return next;
    });
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function scheduleNextHoldTick() {
    const elapsed = Date.now() - holdStartRef.current;
    holdTimerRef.current = setTimeout(() => {
      // -側で既に0まで達している場合は、これ以上リピートしても無意味なので止める。
      if (holdDirectionRef.current === -1 && displayValueRef.current <= 0) {
        clearHoldTimer();
        return;
      }
      applyDelta(holdDirectionRef.current);
      scheduleNextHoldTick();
    }, getHoldRepeatDelay(elapsed));
  }

  // data-direction属性から方向を読み取る単一の安定したハンドラ。
  // (render中にrefを参照するクロージャを都度生成しないようにするため)
  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    const direction = e.currentTarget.dataset.direction === "minus" ? -1 : 1;
    if (direction === -1 && displayValueRef.current <= 0) {
      return;
    }
    holdDirectionRef.current = direction;
    applyDelta(direction);
    holdStartRef.current = Date.now();
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      scheduleNextHoldTick();
    }, HOLD_INITIAL_DELAY_MS);
  }

  function handlePointerEnd() {
    clearHoldTimer();
  }

  function openValueEditor() {
    setDraftValue(String(displayValue));
    setValueError(null);
    setIsEditingValue(true);
  }

  function submitValueEditor() {
    const parsed = Number(draftValue);
    setIsEditingValue(false);
    if (draftValue.trim() === "" || Number.isNaN(parsed) || parsed < 0) {
      setValueError("0以上の数値を入力してください。");
      return;
    }
    setDisplayValue(parsed);
    setValueError(null);
    scheduleSave(parsed);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{goal.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{goalTypeLabel[goal.goal_type]}</p>
        </div>
        <Badge tone={goalStatusTone[displayStatus]}>{goalStatusLabel[displayStatus]}</Badge>
      </div>

      {goal.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{goal.description}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Bar value={progress} max={100} tone={progress >= 100 ? "good" : "neutral"} />
        <span className="shrink-0 text-xs font-medium text-foreground">{progress}%</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          data-direction="minus"
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          disabled={displayValue <= 0}
          aria-label="現在値を1減らす"
          style={{ touchAction: "none" }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>

        {isEditingValue ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            autoFocus
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={submitValueEditor}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitValueEditor();
              }
              if (e.key === "Escape") {
                setIsEditingValue(false);
              }
            }}
            className="w-28 rounded-lg border border-foreground/30 bg-surface-muted px-2 py-1 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        ) : (
          <button
            type="button"
            onClick={openValueEditor}
            className="min-w-0 rounded-lg px-2 py-1 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            {displayValue.toLocaleString("ja-JP")}
            {unit}
          </button>
        )}

        <button
          type="button"
          onPointerDown={handlePointerDown}
          data-direction="plus"
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          aria-label="現在値を1増やす"
          style={{ touchAction: "none" }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-foreground transition-colors hover:bg-surface"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>目標: {goal.target_value.toLocaleString("ja-JP")}{unit}</span>
        {goal.target_date ? <span>期限: {goal.target_date}</span> : null}
        {isSaving ? <span className="text-[11px]">保存中…</span> : null}
      </div>

      {isLinked ? (
        <p className="text-[11px] text-muted-foreground">
          Financeの実績と自動連携中(手動で調整しても、次の売上・経費の登録時に実績値へ再計算されます)
        </p>
      ) : null}

      {valueError ? (
        <p role="alert" className="text-xs text-red-400">
          {valueError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label="編集"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="削除"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </Card>
  );
}
