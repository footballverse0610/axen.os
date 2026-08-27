import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { getUserBusinesses } from "@/lib/supabase/business";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  // 未ログインの場合は通常proxy.tsで/loginへリダイレクト済みだが、
  // 念のためレイアウト側でも防御しておく。
  if (!user) {
    redirect("/login");
  }

  const businesses = await getUserBusinesses();
  if (businesses.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header userEmail={user.email ?? null} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
