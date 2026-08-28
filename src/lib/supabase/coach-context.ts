import "server-only";
import { getDashboardData, type DashboardData } from "./dashboard";
import { calcBusinessSummary, calcGoalProgress } from "./finance";

export type CoachContext = DashboardData;

/**
 * AI Coachの回答生成に使う「現在の事業状況」を取得する。
 * Dashboardと同じgetDashboardData()を再利用することで、
 * Dashboard/Finance/Goalsと矛盾しない同一のデータ・計算(calcBusinessSummary等)
 * を参照する。business_idはgetDashboardData内部のgetCurrentBusiness()
 * (サーバー側・RLS経由)からのみ取得され、クライアント入力は一切使わない。
 */
export async function getCoachContext(): Promise<CoachContext | null> {
  return getDashboardData();
}

/**
 * CoachContextをAIへの入力用に、要点を絞ったテキストへ要約する。
 * 生データを丸ごと渡さず、件数を絞ることでトークン消費を抑える。
 */
export function formatCoachContext(context: CoachContext): string {
  const { business, sales, expenses, openTasks, businessIdeas, activeGoals } = context;
  const { sales: salesTotal, expenses: expensesTotal, profit, margin } = calcBusinessSummary(
    sales,
    expenses,
  );

  const lines: string[] = [];

  lines.push(`事業名: ${business.name}`);
  lines.push(`業種: ${business.industry ?? "未設定"}`);
  lines.push(`ステージ: ${business.stage}`);
  if (business.one_liner) {
    lines.push(`一言紹介: ${business.one_liner}`);
  }

  lines.push("");
  lines.push(`累計売上: ${salesTotal}円 / 累計経費: ${expensesTotal}円 / 利益: ${profit}円 (利益率${margin}%)`);

  lines.push("");
  lines.push(`未完了タスク (${openTasks.length}件中、直近5件):`);
  if (openTasks.length === 0) {
    lines.push("- なし");
  } else {
    for (const task of openTasks.slice(0, 5)) {
      lines.push(
        `- [${task.priority}] ${task.title}${task.due_date ? ` (期限: ${task.due_date})` : ""}`,
      );
    }
  }

  lines.push("");
  lines.push(`ビジネスアイデア (${businessIdeas.length}件中、直近5件):`);
  if (businessIdeas.length === 0) {
    lines.push("- なし");
  } else {
    for (const idea of businessIdeas.slice(0, 5)) {
      lines.push(`- ${idea.title} (ステージ: ${idea.stage}, スコア: ${idea.potential_score})`);
    }
  }

  lines.push("");
  lines.push(`進行中の目標 (${activeGoals.length}件中、直近3件):`);
  if (activeGoals.length === 0) {
    lines.push("- なし");
  } else {
    for (const goal of activeGoals.slice(0, 3)) {
      const progress = calcGoalProgress(goal.current_value, goal.target_value);
      lines.push(`- ${goal.title} (${progress}%達成${goal.target_date ? `, 期限: ${goal.target_date}` : ""})`);
    }
  }

  return lines.join("\n");
}
