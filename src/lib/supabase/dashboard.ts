import "server-only";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import type { Business, BusinessIdea, Expense, Goal, Sale, Task } from "./types";

export interface DashboardData {
  business: Business;
  sales: Sale[];
  expenses: Expense[];
  /** 未完了(done=false)のタスクのみ。期限が近い順。 */
  openTasks: Task[];
  businessIdeas: BusinessIdea[];
  /** ステータスがactiveなgoalのみ。期限が近い順。 */
  activeGoals: Goal[];
}

/**
 * Dashboard表示に必要なデータをまとめて取得する。
 *
 * business_id での絞り込みは「どの事業のデータを見せるか」という業務ロジック
 * 上のフィルタであり、セキュリティの唯一の防波堤ではない。各テーブルのRLS
 * (user_id = auth.uid()) が独立してアクセスを制御しているため、
 * ここではuser_idによる手動フィルタを追加しない。
 *
 * 個々のクエリが失敗しても他の項目の表示を妨げないよう、失敗したクエリは
 * ログに残した上で空配列にフォールバックする(部分的な障害でDashboard全体が
 * 落ちないようにするため)。
 */
export async function getDashboardData(preloadedBusiness?: Business): Promise<DashboardData | null> {
  try {
    return await fetchDashboardData(preloadedBusiness);
  } catch (err) {
    // redirect()/notFound()や、ビルド時の静的化判定(DYNAMIC_SERVER_USAGE)など、
    // Next.jsが制御フローとして送出する特殊なエラーは digest プロパティを持つ。
    // これらは握りつぶさず再送出し、Next.js自身に処理させる。
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    console.error("getDashboardData: 予期しないエラー", err);
    return null;
  }
}

async function fetchDashboardData(preloadedBusiness?: Business): Promise<DashboardData | null> {
  const business = preloadedBusiness ?? (await getCurrentBusiness());
  if (!business) {
    return null;
  }

  const supabase = await createClient();

  const [salesRes, expensesRes, tasksRes, ideasRes, goalsRes] = await Promise.all([
    supabase
      .from("sales")
      .select("*")
      .eq("business_id", business.id)
      .order("sold_on", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .eq("business_id", business.id)
      .order("spent_on", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("business_id", business.id)
      .eq("done", false)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("business_ideas")
      .select("*")
      .eq("business_id", business.id)
      .order("potential_score", { ascending: false }),
    supabase
      .from("goals")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("target_date", { ascending: true, nullsFirst: false }),
  ]);

  if (salesRes.error) console.error("dashboard: sales取得失敗", salesRes.error);
  if (expensesRes.error) console.error("dashboard: expenses取得失敗", expensesRes.error);
  if (tasksRes.error) console.error("dashboard: tasks取得失敗", tasksRes.error);
  if (ideasRes.error) console.error("dashboard: business_ideas取得失敗", ideasRes.error);
  if (goalsRes.error) console.error("dashboard: goals取得失敗", goalsRes.error);

  return {
    business,
    sales: salesRes.data ?? [],
    expenses: expensesRes.data ?? [],
    openTasks: tasksRes.data ?? [],
    businessIdeas: ideasRes.data ?? [],
    activeGoals: goalsRes.data ?? [],
  };
}
