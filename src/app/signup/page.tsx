import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "新規登録 | 起業しよ。",
};

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthCard
        subtitle="今日から、起業しよ。"
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            すでにアカウントをお持ちですか？
          </Link>
        }
      >
        <SignupForm />
      </AuthCard>
    </main>
  );
}
