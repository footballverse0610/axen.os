import type { Metadata } from "next";
import { BusinessListClient } from "@/components/businesses/BusinessListClient";
import { getCurrentBusiness, getUserBusinesses } from "@/lib/supabase/business";

export const metadata: Metadata = {
  title: "事業を切り替える | Axen OS",
};

export default async function BusinessesPage() {
  const businesses = await getUserBusinesses();
  const currentBusiness = (await getCurrentBusiness(businesses)) ?? businesses[0];

  return <BusinessListClient businesses={businesses} currentBusiness={currentBusiness} />;
}
