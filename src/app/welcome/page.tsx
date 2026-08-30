import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/welcome/OnboardingWizard";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "ようこそ | Axen OS",
};

/**
 * 初回オンボーディング(人生の目標・現状のヒアリング)。
 * 既存の事業作成onboarding(/onboarding)より前に案内する新しい入口。
 * 既にonboarding_completed===trueのユーザーには表示せず、
 * 直接アクセスされた場合もホームへ戻す
 * (「すでに完了したユーザーには毎回表示しない」という要件のため)。
 */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (profile?.onboarding_completed) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
