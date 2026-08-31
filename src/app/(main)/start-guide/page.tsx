import type { Metadata } from "next";
import { StartGuideWizard } from "@/components/start-guide/StartGuideWizard";
import { getCurrentBusiness } from "@/lib/supabase/business";

export const metadata: Metadata = {
  title: "何から始める？ | 起業しよ。",
};

export default async function StartGuidePage() {
  const business = await getCurrentBusiness();

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-sm font-medium text-foreground">事業情報が見つかりませんでした</p>
        <p className="text-sm text-muted-foreground">
          時間をおいてページを再読み込みしてください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">何から始める？</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          簡単な質問に答えると、今のあなたが最初にやるべきことが分かります。
        </p>
      </section>

      <StartGuideWizard businessStage={business.stage} industry={business.industry} />
    </div>
  );
}
