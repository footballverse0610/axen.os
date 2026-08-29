import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export const metadata: Metadata = {
  title: "新しいパスワードを設定 | 起業しよ。",
};

/**
 * このページはsrc/app/auth/confirm/route.tsでのトークン検証によって
 * 確立されたセッションを前提とする。proxy.tsのPROTECTED_PATHSにも
 * 含めているが、ここでも念のため直接確認する(他の保護ページと同じ
 * defense-in-depthの方針)。
 */
export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthCard subtitle="新しいパスワードを設定してください" footer={null}>
        <UpdatePasswordForm />
      </AuthCard>
    </main>
  );
}
