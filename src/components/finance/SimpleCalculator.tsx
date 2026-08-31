"use client";

import { X } from "lucide-react";
import { useState } from "react";

type Operator = "+" | "-" | "×" | "÷";

const keyClass =
  "flex h-11 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-surface-muted active:bg-surface-muted";
const operatorKeyClass =
  "flex h-11 items-center justify-center rounded-lg border border-border bg-surface-muted text-sm font-semibold text-foreground transition-colors hover:opacity-80";

function compute(a: number, b: number, op: Operator): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

/**
 * 四則演算のみのシンプルな電卓。eval/Functionは使わず、通常の電卓と同じ
 * 「値・演算子・値」の状態機械で計算する。「金額欄に反映」でTransactionFormの
 * amountへ計算結果(0以上の整数に丸めたもの)を渡す。
 */
export function SimpleCalculator({
  onApply,
  onClose,
}: {
  onApply: (value: number) => void;
  onClose: () => void;
}) {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function resetAfterError() {
    setDisplay("0");
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
  }

  function pressDigit(d: string) {
    setError(null);
    if (overwrite) {
      setDisplay(d);
      setOverwrite(false);
      return;
    }
    if (display === "0") {
      setDisplay(d);
      return;
    }
    setDisplay(display + d);
  }

  function pressDot() {
    setError(null);
    if (overwrite) {
      setDisplay("0.");
      setOverwrite(false);
      return;
    }
    if (display.includes(".")) return;
    setDisplay(`${display}.`);
  }

  function pressOperator(op: Operator) {
    setError(null);
    const current = Number(display);
    if (!Number.isFinite(current)) {
      setError("計算できません");
      return;
    }
    if (accumulator !== null && pendingOp && !overwrite) {
      const result = compute(accumulator, current, pendingOp);
      if (result === null || !Number.isFinite(result)) {
        setError("0で割ることはできません");
        resetAfterError();
        return;
      }
      setAccumulator(result);
      setDisplay(String(result));
    } else {
      setAccumulator(current);
    }
    setPendingOp(op);
    setOverwrite(true);
  }

  function pressEquals() {
    setError(null);
    if (pendingOp === null || accumulator === null) return;
    const current = Number(display);
    const result = compute(accumulator, current, pendingOp);
    if (result === null || !Number.isFinite(result)) {
      setError("0で割ることはできません");
      resetAfterError();
      return;
    }
    setDisplay(String(result));
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
  }

  function pressAC() {
    setError(null);
    resetAfterError();
  }

  function pressApply() {
    const value = Number(display);
    if (!Number.isFinite(value) || value < 0) {
      setError("金額欄には0以上の数値のみ反映できます");
      return;
    }
    onApply(Math.round(value));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">電卓</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="電卓を閉じる"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface px-3 py-2 text-right text-lg font-mono text-foreground">
        {display}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={pressAC} className={operatorKeyClass}>
          AC
        </button>
        <button type="button" onClick={() => pressOperator("÷")} className={operatorKeyClass}>
          ÷
        </button>
        <button type="button" onClick={() => pressOperator("×")} className={operatorKeyClass}>
          ×
        </button>
        <button type="button" onClick={() => pressOperator("-")} className={operatorKeyClass}>
          -
        </button>

        <button type="button" onClick={() => pressDigit("7")} className={keyClass}>
          7
        </button>
        <button type="button" onClick={() => pressDigit("8")} className={keyClass}>
          8
        </button>
        <button type="button" onClick={() => pressDigit("9")} className={keyClass}>
          9
        </button>
        <button
          type="button"
          onClick={() => pressOperator("+")}
          className={`${operatorKeyClass} row-span-2`}
        >
          +
        </button>

        <button type="button" onClick={() => pressDigit("4")} className={keyClass}>
          4
        </button>
        <button type="button" onClick={() => pressDigit("5")} className={keyClass}>
          5
        </button>
        <button type="button" onClick={() => pressDigit("6")} className={keyClass}>
          6
        </button>

        <button type="button" onClick={() => pressDigit("1")} className={keyClass}>
          1
        </button>
        <button type="button" onClick={() => pressDigit("2")} className={keyClass}>
          2
        </button>
        <button type="button" onClick={() => pressDigit("3")} className={keyClass}>
          3
        </button>
        <button
          type="button"
          onClick={pressEquals}
          className={`${operatorKeyClass} row-span-2 bg-foreground text-background hover:opacity-90`}
        >
          =
        </button>

        <button type="button" onClick={() => pressDigit("0")} className={`${keyClass} col-span-2`}>
          0
        </button>
        <button type="button" onClick={pressDot} className={keyClass}>
          .
        </button>
      </div>

      <button
        type="button"
        onClick={pressApply}
        className="w-full rounded-lg bg-foreground py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        金額欄に反映
      </button>
    </div>
  );
}
