import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentBusiness, getUserBusinesses } from "@/lib/supabase/business";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  // 未ログインの場合は通常proxy.tsで/loginへリダイレクト済みだが、
  // 念のためレイアウト側でも防御しておく。
  if (!user) {
    redirect("/login");
  }

  // 人生の目標ヒアリング(/welcome)が未完了なら、事業作成onboardingより先に案内する。
  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) {
    redirect("/welcome");
  }

  const businesses = await getUserBusinesses();
  if (businesses.length === 0) {
    redirect("/onboarding");
  }

  // 既に取得済みのbusinessesを渡し、getCurrentBusiness内での
  // 再問い合わせ(DB往復)を避ける。
  const currentBusiness = (await getCurrentBusiness(businesses)) ?? businesses[0];

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header userEmail={user.email ?? null} currentBusiness={currentBusiness} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
