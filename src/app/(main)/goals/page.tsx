import { GoalsClient } from "@/components/goals/GoalsClient";
import { getBusinessGoals } from "@/lib/supabase/goals";

export default async function GoalsPage() {
  const { goals } = await getBusinessGoals();

  return <GoalsClient goals={goals} />;
}
