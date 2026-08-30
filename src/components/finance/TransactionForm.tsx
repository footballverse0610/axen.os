"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createTransaction,
  updateTransaction,
  type FinanceActionState,
  type TransactionKind,
} from "@/lib/supabase/finance-actions";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { EXPENSE_CATEGORY_SUGGESTIONS, SALE_CATEGORY_SUGGESTIONS } from "@/lib/finance-categories";
import type { FinanceEntry } from "./FinanceClient";

const initialState: FinanceActionState = { error: null };

const fieldClass =
  "rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

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
  const amount = entry?.data.amount;
  const date = entry ? (entry.kind === "sale" ? entry.data.sold_on : entry.data.spent_on) : today();
  const partyName = entry
    ? entry.kind === "sale"
      ? (entry.data.customer_name ?? "")
      : (entry.data.vendor ?? "")
    : "";
  const quantity = entry?.kind === "sale" ? entry.data.quantity : 1;

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
          <label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
            金額（円） <span className="text-red-400">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={amount}
            className={fieldClass}
          />
        </div>

        {isSale ? (
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
              defaultValue={quantity}
              className={fieldClass}
            />
          </div>
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
