import "server-only";
import { createClient } from "./server";
import { getDashboardData, type DashboardData } from "./dashboard";
import { getCurrentProfile } from "./profile";
import { calcBusinessSummary, calcGoalProgress } from "./finance";
import { weeklyTimeLabel } from "../onboarding-options";
import { calcDueUrgency, dueUrgencyLabel } from "../task-due";
import { goalStatusLabel } from "../goal-status";
import type { Business, Goal, Profile } from "./types";

/**
 * DashboardDataを拡張(交差型)する形でprofile・補足データを追加する。既存の
 * context.business/context.sales等のフィールドアクセスはそのまま動作し続ける
 * (後方互換)。
 *
 * completedTaskCount/otherGoalsは、Dashboard画面では使わないAIコーチ専用の
 * 補足データのため、getDashboardData/DashboardData自体には加えず、ここで
 * 別クエリとして取得する(Dashboard画面に不要なクエリを負わせない設計)。
 */
export type CoachContext = DashboardData & {
  profile: Profile | null;
  /** 完了済みタスクの件数(件数のみ。本文は渡さずトークン消費を抑える)。 */
  completedTaskCount: number;
  /** status='active'以外(achieved/missed/paused)の目標。直近更新順、最大5件。 */
  otherGoals: Goal[];
};

/**
 * AI Coachの回答生成に使う「現在の事業状況」+「初回オンボーディングで
 * 伝えられた人生の目標」を取得する。
 * 事業データはDashboardと同じgetDashboardData()を再利用することで、
 * Dashboard/Finance/Goalsと矛盾しない同一のデータ・計算(calcBusinessSummary等)
 * を参照する。business_id/user_idはgetDashboardData/getCurrentProfile内部の
 * getCurrentBusiness()・getCurrentUser()(サーバー側・RLS経由)からのみ取得され、
 * クライアント入力は一切使わない。
 *
 * 追加の2クエリ(completedTaskCount/otherGoals)も同じbusiness.idで絞り込み、
 * 各テーブルのRLS(user_id = auth.uid())が引き続きアクセス制御の本体を担う。
 * completedTaskCountはhead:trueで件数のみ取得し本文は取得しない。otherGoalsは
 * 最大5件に絞り、AIへの入力が不必要に長くならないようにする。
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

  const supabase = await createClient();
  const businessId = dashboardData.business.id;

  const [profile, completedTaskCountRes, otherGoalsRes] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("done", true),
    supabase
      .from("goals")
      .select("*")
      .eq("business_id", businessId)
      .neq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  if (completedTaskCountRes.error) {
    console.error("getCoachContext: 完了タスク件数取得失敗", completedTaskCountRes.error);
  }
  if (otherGoalsRes.error) {
    console.error("getCoachContext: 終了した目標取得失敗", otherGoalsRes.error);
  }

  return {
    ...dashboardData,
    profile,
    completedTaskCount: completedTaskCountRes.count ?? 0,
    otherGoals: otherGoalsRes.data ?? [],
  };
}

/**
 * CoachContextをAIへの入力用に、要点を絞ったテキストへ要約する。
 * 生データを丸ごと渡さず、件数を絞ることでトークン消費を抑える。
 *
 * タスク・目標・財政・アイデアを互いに関連づけて提示する(改善②):
 * - タスクは期限の緊急度(calcDueUrgency)を併記し、完了件数も伝える
 * - アイデアは、紐づく未完了タスクの有無(business_idea_id)を併記する
 * - 財政データが一件も無い場合は、推測の材料にできないことを明示する
 * - 終了した(active以外の)目標も、達成/未達成の状況として伝える
 * いずれも既に取得済みのopenTasks/businessIdeas等から計算するだけで、
 * 新規のDBクエリは発生しない。
 */
export function formatCoachContext(context: CoachContext): string {
  const {
    business,
    sales,
    expenses,
    openTasks,
    businessIdeas,
    activeGoals,
    otherGoals,
    completedTaskCount,
    profile,
  } = context;
  const { sales: salesTotal, expenses: expensesTotal, profit, margin } = calcBusinessSummary(
    sales,
    expenses,
  );

  const lines: string[] = [];

  if (profile?.onboarding_completed) {
    lines.push("ユーザーが初回登録時に伝えた起業の状況:");
    if (profile.needs_idea_help) {
      lines.push("- まだ事業アイデアが決まっていない。最初の会話ではアイデア出しを積極的にサポートすること。");
    }
    if (profile.current_challenges.length > 0) {
      lines.push(`- 今の課題: ${profile.current_challenges.join("、")}`);
    }
    if (profile.weekly_available_time) {
      lines.push(`- 起業に使える時間: ${weeklyTimeLabel[profile.weekly_available_time]}`);
    }
    if (profile.initial_budget_range) {
      lines.push(`- 初期予算: ${profile.initial_budget_range}`);
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
  if (sales.length === 0 && expenses.length === 0) {
    lines.push("財政: 売上・経費のデータがまだ登録されていない(データ不足。資金状況は推測しないこと)。");
  } else {
    lines.push(`累計売上: ${salesTotal}円 / 累計経費: ${expensesTotal}円 / 利益: ${profit}円 (利益率${margin}%)`);
  }

  lines.push("");
  lines.push(`未完了タスク (${openTasks.length}件中、直近5件) / 完了済みタスク: ${completedTaskCount}件`);
  if (openTasks.length === 0) {
    lines.push("- なし");
  } else {
    const overdueCount = openTasks.filter((t) => calcDueUrgency(t.due_date) === "overdue").length;
    const dueSoonCount = openTasks.filter((t) =>
      ["today", "tomorrow", "soon"].includes(calcDueUrgency(t.due_date)),
    ).length;
    if (overdueCount > 0) {
      lines.push(`- 期限切れのタスクが${overdueCount}件ある`);
    }
    if (dueSoonCount > 0) {
      lines.push(`- 期限が近い(今週中まで)タスクが${dueSoonCount}件ある`);
    }
    for (const task of openTasks.slice(0, 5)) {
      const urgencyLabel = dueUrgencyLabel[calcDueUrgency(task.due_date)];
      lines.push(
        `- [${task.priority}] ${task.title}${task.due_date ? ` (期限: ${task.due_date}${urgencyLabel ? `, ${urgencyLabel}` : ""})` : ""}`,
      );
    }
  }

  lines.push("");
  lines.push(`ビジネスアイデア (${businessIdeas.length}件中、直近5件):`);
  if (businessIdeas.length === 0) {
    lines.push("- なし");
  } else {
    for (const idea of businessIdeas.slice(0, 5)) {
      const linkedTaskCount = openTasks.filter((t) => t.business_idea_id === idea.id).length;
      const linkageNote = linkedTaskCount > 0 ? `, 実行中タスク${linkedTaskCount}件` : ", 実行中タスクなし";
      lines.push(`- ${idea.title} (ステージ: ${idea.stage}, スコア: ${idea.potential_score}${linkageNote})`);
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

  lines.push("");
  lines.push(`終了した目標 (${otherGoals.length}件中、直近5件):`);
  if (otherGoals.length === 0) {
    lines.push("- なし");
  } else {
    for (const goal of otherGoals.slice(0, 5)) {
      lines.push(`- ${goal.title} (${goalStatusLabel[goal.status]}${goal.target_date ? `, 期限: ${goal.target_date}` : ""})`);
    }
  }

  return lines.join("\n");
}
