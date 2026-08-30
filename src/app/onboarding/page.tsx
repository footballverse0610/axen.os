import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { getUserBusinesses } from "@/lib/supabase/business";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "初回設定 | 起業しよ。",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 人生の目標ヒアリング(/welcome)を先に完了させる。
  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) {
    redirect("/welcome");
  }

  const businesses = await getUserBusinesses();
  if (businesses.length > 0) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            まず、何を始める？
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            事業の情報はあとからいつでも編集できます。
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
