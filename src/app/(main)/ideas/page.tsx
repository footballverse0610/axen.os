import { IdeasClient } from "@/components/ideas/IdeasClient";
import { getBusinessIdeas } from "@/lib/supabase/ideas";

export default async function IdeasPage() {
  const { ideas } = await getBusinessIdeas();

  return <IdeasClient ideas={ideas} />;
}
