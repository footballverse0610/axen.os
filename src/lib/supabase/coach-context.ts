import "server-only";
import { getDashboardData, type DashboardData } from "./dashboard";
import { getCurrentProfile } from "./profile";
import { calcBusinessSummary, calcGoalProgress } from "./finance";
import { currentStateLabel, availableTimeLabel } from "../onboarding-options";
import type { Business, Profile } from "./types";

/**
 * DashboardDataを拡張(交差型)する形でprofileを追加する。既存のcontext.business
 * /context.sales等のフィールドアクセスはそのまま動作し続ける(後方互換)。
 */
export type CoachContext = DashboardData & { profile: Profile | null };

/**
 * AI Coachの回答生成に使う「現在の事業状況」+「初回オンボーディングで
 * 伝えられた人生の目標」を取得する。
 * 事業データはDashboardと同じgetDashboardData()を再利用することで、
 * Dashboard/Finance/Goalsと矛盾しない同一のデータ・計算(calcBusinessSummary等)
 * を参照する。business_id/user_idはgetDashboardData/getCurrentProfile内部の
 * getCurrentBusiness()・getCurrentUser()(サーバー側・RLS経由)からのみ取得され、
 * クライアント入力は一切使わない。
 *
 * preloadedBusiness: 呼び出し元(/api/coach/route.ts)が既にgetCurrentBusiness()
 * 済みの場合に渡すと、getDashboardData内部での再取得を避けられる
 * (Route Handlerはpage.tsx/layout.tsxと同じReactレンダーツリーに属さないため、
 * React cache()による自動的な重複排除に頼らず、明示的に値を渡す)。
 */
export async function getCoachContext(preloadedBusiness?: Business): Promise<CoachContext | null> {
  const dashboardData = await getDashboardData(preloadedBusiness);
  if (!dashboardData) {
    return null;
  }

  const profile = await getCurrentProfile();

  return { ...dashboardData, profile };
}

/**
 * CoachContextをAIへの入力用に、要点を絞ったテキストへ要約する。
 * 生データを丸ごと渡さず、件数を絞ることでトークン消費を抑える。
 */
export function formatCoachContext(context: CoachContext): string {
  const { business, sales, expenses, openTasks, businessIdeas, activeGoals, profile } = context;
  const { sales: salesTotal, expenses: expensesTotal, profit, margin } = calcBusinessSummary(
    sales,
    expenses,
  );

  const lines: string[] = [];

  if (profile?.onboarding_completed) {
    lines.push("ユーザーが初回登録時に伝えた希望:");
    if (profile.main_goals.length > 0) {
      lines.push(`- 変えたいこと: ${profile.main_goals.join("、")}`);
    }
    if (profile.current_state) {
      lines.push(`- 現在の状態: ${currentStateLabel[profile.current_state]}`);
    }
    if (profile.three_month_goal) {
      lines.push(`- 3ヶ月後の目標: ${profile.three_month_goal}`);
    }
    if (profile.available_time) {
      lines.push(`- 1日に使える時間: ${availableTimeLabel[profile.available_time]}`);
    }
    if (profile.coach_preferences.length > 0) {
      lines.push(`- AIコーチに求めること: ${profile.coach_preferences.join("、")}`);
    }
    lines.push("");
  }

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
