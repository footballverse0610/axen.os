import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/welcome/OnboardingWizard";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "ようこそ | 起業しよ。",
};

/**
 * 初回オンボーディング(起業ステージ・事業内容・課題・目標のヒアリング)。
 * このウィザード内で事業(businesses)も1件作成するため、完了後は
 * (main)/layout.tsxのbusinesses.length===0チェックには通常到達しない
 * (/onboardingは異常系のフォールバック経路として残す)。
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
