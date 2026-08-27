import { FinanceClient } from "@/components/finance/FinanceClient";
import { getFinanceData } from "@/lib/supabase/finance-data";

export default async function FinancePage() {
  const { sales, expenses } = await getFinanceData();

  return <FinanceClient sales={sales} expenses={expenses} />;
}
