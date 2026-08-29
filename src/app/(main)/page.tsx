import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatYen } from "@/lib/finance";
import { stageLabel, stageTone } from "@/lib/idea-stage";
import { priorityTone } from "@/lib/task-priority";
import { getDashboardData } from "@/lib/supabase/dashboard";
import { calcBusinessSummary, calcGoalProgress } from "@/lib/supabase/finance";

interface RecentTransaction {
  id: string;
  kind: "sale" | "expense";
  label: string;
  category: string;
  amount: number;
  date: string;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-sm font-medium text-foreground">データを読み込めませんでした</p>
        <p className="text-sm text-muted-foreground">
          時間をおいてページを再読み込みしてください。
        </p>
      </div>
    );
  }

  const { business, sales, expenses, openTasks, businessIdeas, activeGoals } = data;

  const { sales: salesTotal, expenses: expensesTotal, profit, margin } = calcBusinessSummary(
    sales,
    expenses,
  );
  const maxFlow = Math.max(salesTotal, expensesTotal, 1);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = openTasks.filter((t) => t.due_date === todayStr);
  const displayTasks = (todayTasks.length > 0 ? todayTasks : openTasks).slice(0, 3);

  const topTask = displayTasks[0] ?? null;

  const topIdeas = businessIdeas.slice(0, 2);

  const goal = activeGoals[0] ?? null;
  const goalProgress = goal ? calcGoalProgress(goal.current_value, goal.target_value) : 0;

  const recentTransactions: RecentTransaction[] = [
    ...sales.map((s) => ({
      id: s.id,
      kind: "sale" as const,
      label: s.label,
      category: s.category,
      amount: s.amount,
      date: s.sold_on,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      kind: "expense" as const,
      label: e.label,
      category: e.category,
      amount: e.amount,
      date: e.spent_on,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm text-muted-foreground">おかえりなさい</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {business.name}の状態
        </h2>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="売上" value={formatYen(salesTotal)} />
        <StatCard
          label="利益"
          value={formatYen(profit)}
          delta={`利益率 ${margin}%`}
          deltaTone={profit >= 0 ? "good" : "critical"}
        />
        <StatCard label="未完了タスク" value={String(openTasks.length)} />
        <StatCard label="ビジネスアイデア" value={String(businessIdeas.length)} />
      </section>

      <section>
        <Card className="flex items-start gap-4 border-white/10 bg-surface-muted/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
            <Sparkles className="h-5 w-5 text-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              AI Business Coach
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {topTask
                ? `「${topTask.title}」が今の優先タスクです。進め方に迷ったらコーチに相談してみましょう。`
                : "タスクや目標について、AIコーチに相談してみましょう。"}
            </p>
            <Link
              href="/coach"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground"
            >
              コーチに相談する
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="今日やること" href="/tasks" />
        <div className="flex flex-col gap-2">
          {displayTasks.map((task) => (
            <Card key={task.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{task.category}</p>
              </div>
              <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
            </Card>
          ))}
          {displayTasks.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              未完了のタスクはありません。
            </Card>
          ) : null}
        </div>
      </section>

      <section>
        <SectionHeader title="ビジネスアイデア" href="/ideas" />
        <div className="flex flex-col gap-2">
          {topIdeas.map((idea) => (
            <Card key={idea.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-foreground">{idea.title}</p>
                <Badge tone={stageTone[idea.stage]}>{stageLabel[idea.stage]}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Bar value={idea.potential_score} max={100} />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {idea.potential_score}
                </span>
              </div>
            </Card>
          ))}
          {topIdeas.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              まだビジネスアイデアが登録されていません。
            </Card>
          ) : null}
        </div>
      </section>

      <section>
        <SectionHeader title="収支サマリー" href="/finance" />
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
        <SectionHeader title="最近の取引" href="/finance" />
        <div className="flex flex-col gap-2">
          {recentTransactions.map((tx) => {
            const isSale = tx.kind === "sale";
            return (
              <Card key={`${tx.kind}-${tx.id}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
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
                    <p className="truncate text-sm font-medium text-foreground">{tx.label}</p>
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
          {recentTransactions.length === 0 ? (
            <Card className="text-sm text-muted-foreground">
              まだ売上・経費が登録されていません。
            </Card>
          ) : null}
        </div>
      </section>

      <section>
        <SectionHeader title="目標" href="/goals" />
        {goal ? (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-foreground">{goal.title}</p>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {goalProgress}%
              </span>
            </div>
            <Bar value={goalProgress} max={100} tone={goalProgress >= 100 ? "good" : "neutral"} />
            {goal.target_date ? (
              <p className="text-xs text-muted-foreground">期限: {goal.target_date}</p>
            ) : null}
          </Card>
        ) : (
          <Card className="text-sm text-muted-foreground">
            進行中の目標はまだ設定されていません。
          </Card>
        )}
      </section>
    </div>
  );
}
