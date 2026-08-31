"use client";

import { Calculator } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  createTransaction,
  updateTransaction,
  type FinanceActionState,
  type TransactionKind,
} from "@/lib/supabase/finance-actions";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { EXPENSE_CATEGORY_SUGGESTIONS, SALE_CATEGORY_SUGGESTIONS } from "@/lib/finance-categories";
import { SimpleCalculator } from "./SimpleCalculator";
import type { FinanceEntry } from "./FinanceClient";

const initialState: FinanceActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

/** 金額欄の入力補助。「単価×数量」と「電卓」は同時に開かず、片方だけ表示する。 */
type AmountAid = "none" | "unitPrice" | "calculator";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  entry,
  onDone,
}: {
  entry?: FinanceEntry;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<TransactionKind>(entry?.kind ?? "sale");
  const action = entry ? updateTransaction : createTransaction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  const isSale = kind === "sale";
  const partyLabel = isSale ? "顧客名" : "支払先";

  const label = entry?.data.label;
  const category = entry?.data.category;
  const amountDefault = entry?.data.amount;
  const date = entry ? (entry.kind === "sale" ? entry.data.sold_on : entry.data.spent_on) : today();
  const partyName = entry
    ? entry.kind === "sale"
      ? (entry.data.customer_name ?? "")
      : (entry.data.vendor ?? "")
    : "";
  const initialQuantity = entry?.kind === "sale" ? entry.data.quantity : 1;

  // amountは、直接入力・単価×数量パネル・電卓のいずれからも書き込める
  // 単一の状態にする(3つの入力手段が競合しないよう、常に同じ値を経由させる)。
  const [amount, setAmount] = useState(amountDefault != null ? String(amountDefault) : "");
  const [quantity, setQuantity] = useState(String(initialQuantity ?? 1));
  const [unitPrice, setUnitPrice] = useState("");
  const [aid, setAid] = useState<AmountAid>("none");

  const unitPriceNum = Number(unitPrice);
  const quantityNum = Number(quantity);
  const unitPriceTotal =
    unitPrice.trim() !== "" &&
    quantity.trim() !== "" &&
    Number.isFinite(unitPriceNum) &&
    Number.isFinite(quantityNum) &&
    unitPriceNum >= 0 &&
    quantityNum > 0
      ? Math.round(unitPriceNum * quantityNum)
      : null;

  // 単価・数量の入力ハンドラ内で直接金額へ反映する(useEffect経由の
  // setStateは連鎖的な再レンダリングを招くため避け、入力イベントの中で完結させる)。
  function syncAmountFromUnitPrice(nextUnitPrice: string, nextQuantity: string) {
    const priceNum = Number(nextUnitPrice);
    const qtyNum = Number(nextQuantity);
    if (
      nextUnitPrice.trim() !== "" &&
      nextQuantity.trim() !== "" &&
      Number.isFinite(priceNum) &&
      Number.isFinite(qtyNum) &&
      priceNum >= 0 &&
      qtyNum > 0
    ) {
      setAmount(String(Math.round(priceNum * qtyNum)));
    }
  }

  function handleUnitPriceChange(value: string) {
    setUnitPrice(value);
    syncAmountFromUnitPrice(value, quantity);
  }

  function handleUnitPriceQuantityChange(value: string) {
    setQuantity(value);
    syncAmountFromUnitPrice(unitPrice, value);
  }

  function toggleAid(next: AmountAid) {
    setAid((prev) => (prev === next ? "none" : next));
  }

  function handleCalculatorApply(value: number) {
    if (!Number.isFinite(value) || value < 0) return;
    setAmount(String(Math.round(value)));
    setAid("none");
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {entry ? <input type="hidden" name="entryId" value={entry.data.id} /> : null}
      <input type="hidden" name="kind" value={kind} />

      {!entry ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setKind("sale")}
            className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
              kind === "sale"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            売上
          </button>
          <button
            type="button"
            onClick={() => setKind("expense")}
            className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
              kind === "expense"
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            経費
          </button>
        </div>
      ) : (
        <p className="text-xs font-medium text-muted-foreground">
          種別: {isSale ? "売上" : "経費"}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="label" className="text-xs font-medium text-muted-foreground">
          取引名 <span className="text-red-400">*</span>
        </label>
        <input
          id="label"
          name="label"
          type="text"
          required
          maxLength={100}
          defaultValue={label}
          className={fieldClass}
          placeholder={isSale ? "例：オンライン講座 販売" : "例：広告費(SNS運用)"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
          カテゴリー <span className="text-red-400">*</span>
        </label>
        <CategoryPicker
          id="category"
          name="category"
          defaultValue={category}
          required
          suggestions={isSale ? SALE_CATEGORY_SUGGESTIONS : EXPENSE_CATEGORY_SUGGESTIONS}
          placeholder={isSale ? "例：商品売上" : "例：広告費"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="partyName" className="text-xs font-medium text-muted-foreground">
          {partyLabel}
        </label>
        <input
          id="partyName"
          name="partyName"
          type="text"
          maxLength={100}
          defaultValue={partyName}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
              金額（円） <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleAid("unitPrice")}
                aria-pressed={aid === "unitPrice"}
                className={`rounded-full border px-2 py-1 text-[11px] font-medium transition-colors ${
                  aid === "unitPrice"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                単価×数量
              </button>
              <button
                type="button"
                onClick={() => toggleAid("calculator")}
                aria-pressed={aid === "calculator"}
                aria-label="電卓を開く"
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                  aid === "calculator"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldClass}
          />
        </div>

        {isSale ? (
          aid === "unitPrice" ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">数量</span>
              <p className={`${fieldClass} flex items-center text-muted-foreground`}>
                下欄で入力してください
              </p>
              <input type="hidden" name="quantity" value={quantity} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quantity" className="text-xs font-medium text-muted-foreground">
                数量
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={fieldClass}
              />
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-xs font-medium text-muted-foreground">
              日付 <span className="text-red-400">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={date}
              className={fieldClass}
            />
          </div>
        )}
      </div>

      {aid === "unitPrice" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">単価 × 数量で入力</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="unitPrice" className="text-xs text-muted-foreground">
                単価（円）
              </label>
              <input
                id="unitPrice"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="unitPriceQuantity" className="text-xs text-muted-foreground">
                数量
              </label>
              <input
                id="unitPriceQuantity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => handleUnitPriceQuantityChange(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            合計金額: {unitPriceTotal !== null ? `${unitPriceTotal.toLocaleString("ja-JP")}円` : "―"}
            （金額欄に自動反映されます）
          </p>
        </div>
      ) : null}

      {aid === "calculator" ? (
        <SimpleCalculator onApply={handleCalculatorApply} onClose={() => setAid("none")} />
      ) : null}

      {isSale ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="saleDate" className="text-xs font-medium text-muted-foreground">
            日付 <span className="text-red-400">*</span>
          </label>
          <input
            id="saleDate"
            name="date"
            type="date"
            required
            defaultValue={date}
            className={fieldClass}
          />
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "保存中…" : entry ? "変更を保存" : "登録する"}
      </button>
    </form>
  );
}
