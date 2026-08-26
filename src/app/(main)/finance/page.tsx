import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { calcProfit, formatYen } from "@/lib/finance";
import { mockTransactions } from "@/lib/mock-data";

export default function FinancePage() {
  const { sales, expenses, profit, margin } = calcProfit(mockTransactions);
  const maxFlow = Math.max(sales, expenses, 1);
  const sortedTransactions = [...mockTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="売上" value={formatYen(sales)} />
        <StatCard label="経費" value={formatYen(expenses)} />
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
              <span className="font-medium text-foreground">{formatYen(sales)}</span>
            </div>
            <Bar value={sales} max={maxFlow} tone="good" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">経費</span>
              <span className="font-medium text-foreground">{formatYen(expenses)}</span>
            </div>
            <Bar value={expenses} max={maxFlow} tone="critical" />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="取引履歴" />
        <div className="flex flex-col gap-2">
          {sortedTransactions.map((tx) => {
            const isSale = tx.type === "sale";
            return (
              <Card key={tx.id} className="flex items-center justify-between gap-3 py-3">
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
                      {tx.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tx.category} ・ {tx.date}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    isSale ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isSale ? "+" : "-"}
                  {formatYen(tx.amount)}
                </span>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
