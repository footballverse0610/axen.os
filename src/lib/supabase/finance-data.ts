import "server-only";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import type { Business, Expense, Sale } from "./types";

/**
 * 現在の事業に紐づく売上・経費を取得する。
 * business_idは必ずgetCurrentBusiness()(RLSで絞り込まれたbusinessesから
 * 取得した値)を使用し、user_idによる手動フィルタは追加しない
 * (sales/expensesのRLSがuser_id=auth.uid()を独立して保証する)。
 *
 * 計算ロジック(calcBusinessSummary)はDashboardと同じ src/lib/supabase/finance.ts
 * を共有し、数値の整合性を保つ。
 */
export async function getFinanceData(): Promise<{
  business: Business | null;
  sales: Sale[];
  expenses: Expense[];
}> {
  const business = await getCurrentBusiness();
  if (!business) {
    return { business: null, sales: [], expenses: [] };
  }

  const supabase = await createClient();
  const [salesRes, expensesRes] = await Promise.all([
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
  ]);

  if (salesRes.error) {
    console.error("getFinanceData: sales取得失敗", salesRes.error);
    throw new Error("収支データを読み込めませんでした");
  }
  if (expensesRes.error) {
    console.error("getFinanceData: expenses取得失敗", expensesRes.error);
    throw new Error("収支データを読み込めませんでした");
  }

  return { business, sales: salesRes.data ?? [], expenses: expensesRes.data ?? [] };
}
