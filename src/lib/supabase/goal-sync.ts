import "server-only";
import { createClient } from "./server";
import { calcLinkedGoalValue, LINKED_GOAL_TYPES } from "./finance";

/**
 * 指定businessのrevenue/profit/sales_count型の目標について、現在のsales/expenses
 * からcurrent_valueを再計算してDBへ書き込む(custom型は対象外、手動管理のまま)。
 *
 * 呼び出しタイミング:
 * - Financeの取引(sale/expense)を作成・更新・削除した直後(finance-actions.ts)
 * - 目標自体を作成・更新した直後(goal-actions.ts、goal_type/start_date/target_dateの
 *   変更が計算結果に影響するため)
 *
 * ユーザーがGoalカードの+/-・直接入力で現在値を手動調整した場合(adjustGoalCurrentValue)
 * は、この関数を呼ばない。手動調整値は次にFinanceの取引が変動するまで保持される
 * (このセッションでの実装方針として、自動計算タイプにも手動上書きを許可する)。
 *
 * 個々のgoal更新が失敗しても他のgoalの再計算は継続する(部分的な障害で
 * Finance/Goalの操作自体を失敗させないため)。
 */
export async function recalcLinkedGoals(businessId: string): Promise<void> {
  const supabase = await createClient();

  const [goalsRes, salesRes, expensesRes] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("business_id", businessId)
      .in("goal_type", LINKED_GOAL_TYPES),
    supabase.from("sales").select("*").eq("business_id", businessId),
    supabase.from("expenses").select("*").eq("business_id", businessId),
  ]);

  if (goalsRes.error) {
    console.error("recalcLinkedGoals: goals取得失敗", goalsRes.error);
    return;
  }
  if (salesRes.error) {
    console.error("recalcLinkedGoals: sales取得失敗", salesRes.error);
    return;
  }
  if (expensesRes.error) {
    console.error("recalcLinkedGoals: expenses取得失敗", expensesRes.error);
    return;
  }

  const goals = goalsRes.data ?? [];
  const sales = salesRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  await Promise.all(
    goals.map(async (goal) => {
      const newValue = calcLinkedGoalValue(
        goal.goal_type,
        goal.start_date,
        goal.target_date,
        sales,
        expenses,
      );
      if (newValue === goal.current_value) {
        return;
      }
      const { error } = await supabase
        .from("goals")
        .update({ current_value: newValue })
        .eq("id", goal.id);
      if (error) {
        console.error("recalcLinkedGoals: goal更新失敗", goal.id, error);
      }
    }),
  );
}
