import { CoachChat } from "@/components/coach/CoachChat";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getCoachMessages } from "@/lib/supabase/coach-messages";

export default async function CoachPage() {
  const business = await getCurrentBusiness();
  const initialMessages = business ? await getCoachMessages(business.id) : [];

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

  return <CoachChat initialMessages={initialMessages} />;
}
