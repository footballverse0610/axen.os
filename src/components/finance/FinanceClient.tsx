"use client";

import { ArrowDownRight, ArrowUpRight, Download, Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatYen } from "@/lib/finance";
import { calcBusinessSummary } from "@/lib/supabase/finance";
import type { Expense, Sale } from "@/lib/supabase/types";
import { TransactionForm } from "./TransactionForm";
import { DeleteTransactionModal } from "./DeleteTransactionModal";

export type FinanceEntry =
  | { kind: "sale"; data: Sale }
  | { kind: "expense"; data: Expense };

type ModalState =
  | { type: "create" }
  | { type: "edit"; entry: FinanceEntry }
  | { type: "delete"; entry: FinanceEntry }
  | null;

export function FinanceClient({ sales, expenses }: { sales: Sale[]; expenses: Expense[] }) {
  const [modal, setModal] = useState<ModalState>(null);

  const { sales: salesTotal, expenses: expensesTotal, profit, margin } = calcBusinessSummary(
    sales,
    expenses,
  );
  const maxFlow = Math.max(salesTotal, expensesTotal, 1);

  const entries: FinanceEntry[] = [
    ...sales.map((s): FinanceEntry => ({ kind: "sale", data: s })),
    ...expenses.map((e): FinanceEntry => ({ kind: "expense", data: e })),
  ].sort((a, b) => {
    const dateA = a.kind === "sale" ? a.data.sold_on : a.data.spent_on;
    const dateB = b.kind === "sale" ? b.data.sold_on : b.data.spent_on;
    return dateA < dateB ? 1 : dateA > dateB ? -1 : 0;
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">売上・経費を記録します。</p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/api/finance/export"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            CSV出力
          </a>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            追加
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="売上" value={formatYen(salesTotal)} />
        <StatCard label="経費" value={formatYen(expensesTotal)} />
        <StatCard
          label="利益"
          value={formatYen(profit)}
          delta={profit >= 0 ? "黒字" : "赤字"}
          deltaTone={profit >= 0 ? "good" : "critical"}
        />
        <StatCard label="利益率" value={`${margin}%`} />
      </section>

      <section>
        <SectionHeader title="収支バランス" />
        <Card className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">売上</span>
              <span className="font-medium text-foreground">{formatYen(salesTotal)}</span>
            </div>
            <Bar value={salesTotal} max={maxFlow} tone="good" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">経費</span>
              <span className="font-medium text-foreground">{formatYen(expensesTotal)}</span>
            </div>
            <Bar value={expensesTotal} max={maxFlow} tone="critical" />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="取引履歴" />
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isSale = entry.kind === "sale";
            const date = isSale ? entry.data.sold_on : entry.data.spent_on;
            return (
              <Card
                key={`${entry.kind}-${entry.data.id}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isSale ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isSale ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-400" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.data.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.data.category} ・ {date}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isSale ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isSale ? "+" : "-"}
                    {formatYen(entry.data.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModal({ type: "edit", entry })}
                      aria-label="編集"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: "delete", entry })}
                      aria-label="削除"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                <Wallet className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground">
                まだ売上・経費が登録されていません
              </p>
              <p className="text-sm text-muted-foreground">
                最初の取引を記録してみよう。
              </p>
              <button
                type="button"
                onClick={() => setModal({ type: "create" })}
                className="mt-2 flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                取引を追加
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {modal?.type === "create" ? (
        <Modal title="取引を追加" onClose={() => setModal(null)}>
          <TransactionForm onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "edit" ? (
        <Modal
          title={modal.entry.kind === "sale" ? "売上を編集" : "経費を編集"}
          onClose={() => setModal(null)}
        >
          <TransactionForm entry={modal.entry} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteTransactionModal entry={modal.entry} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}
