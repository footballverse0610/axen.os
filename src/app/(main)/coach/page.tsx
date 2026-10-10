import { CoachChat } from "@/components/coach/CoachChat";
import { resolveCoachCharacter } from "@/lib/coach/characters";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getCoachMessages } from "@/lib/supabase/coach-messages";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const business = await getCurrentBusiness();
  // getCurrentProfile()はReact cache()で1リクエスト内メモ化されるため、
  // (main)/layout.tsxで既に呼ばれている分の再取得コストは発生しない。
  const [initialMessages, profile] = await Promise.all([
    business ? getCoachMessages(business.id) : Promise.resolve([]),
    getCurrentProfile(),
  ]);
  const { prompt } = await searchParams;
  const coachCharacterId = resolveCoachCharacter(profile?.coach_character).id;

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

  // key={business.id}: CoachChatはストリーミング中の会話を保持するため
  // initialMessagesをuseStateの初期値としてのみ使う。事業切り替え時に
  // 別事業の履歴へ確実に入れ替えるため、business.id が変わったら
  // コンポーネントごと再マウントさせる。
  return (
    <CoachChat
      key={business.id}
      initialMessages={initialMessages}
      initialInput={prompt}
      coachCharacterId={coachCharacterId}
    />
  );
}
