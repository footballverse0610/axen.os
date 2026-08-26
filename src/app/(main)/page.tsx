import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { calcProfit, formatYen } from "@/lib/finance";
import { mockIdeas, mockTasks, mockTransactions } from "@/lib/mock-data";
import { stageLabel, stageTone } from "@/lib/idea-stage";
import { priorityTone } from "@/lib/task-priority";

export default function DashboardPage() {
  const { sales, expenses, profit, margin } = calcProfit(mockTransactions);
  const openTasks = mockTasks.filter((t) => !t.done);
  const topTasks = [...openTasks]
    .sort((a, b) => (a.priority === "HIGH" ? -1 : b.priority === "HIGH" ? 1 : 0))
    .slice(0, 3);
  const topIdeas = mockIdeas.slice(0, 2);
  const maxFlow = Math.max(sales, expenses, 1);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm text-muted-foreground">おかえりなさい</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          今のビジネスの状態
        </h2>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="今月の売上" value={formatYen(sales)} delta="+12%" deltaTone="good" />
        <StatCard label="今月の利益" value={formatYen(profit)} delta={`利益率 ${margin}%`} deltaTone="good" />
        <StatCard label="未完了タスク" value={String(openTasks.length)} />
        <StatCard label="ビジネスアイデア" value={String(mockIdeas.length)} />
      </section>

      <section>
        <Card className="flex items-start gap-4 border-white/10 bg-surface-muted/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
            <Sparkles className="h-5 w-5 text-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              AI Business Coachから
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              「LP用のキャッチコピー案」の期限が今日です。既存顧客ヒアリングの結果を反映すると説得力が上がります。
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
          {topTasks.map((task) => (
            <Card key={task.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{task.category}</p>
              </div>
              <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
            </Card>
          ))}
          {topTasks.length === 0 ? (
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
                <Bar value={idea.potentialScore} max={100} />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {idea.potentialScore}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="収支サマリー" href="/finance" />
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
    </div>
  );
}
