import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ログイン | 起業しよ。",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthCard
        subtitle="アカウントにログイン"
        footer={
          <>
            アカウントをお持ちでないですか？{" "}
            <Link href="/signup" className="font-medium text-foreground hover:underline">
              アカウントを作る
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </main>
  );
}
