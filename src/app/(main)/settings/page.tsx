import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { logout } from "@/lib/supabase/actions";

export const metadata: Metadata = {
  title: "設定 | 起業しよ。",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-sm font-medium text-foreground">ユーザー情報を読み込めませんでした</p>
        <p className="text-sm text-muted-foreground">
          時間をおいてページを再読み込みしてください。
        </p>
      </div>
    );
  }

  const profile = await getCurrentProfile();
  const isEmailConfirmed = Boolean(user.email_confirmed_at);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">設定</h2>
      </section>

      <section>
        <SectionHeader title="プロフィール" />
        <Card>
          <ProfileForm profile={profile} />
        </Card>
      </section>

      <section>
        <SectionHeader title="アカウント" />
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">メールアドレス</span>
            <span className="text-sm font-medium text-foreground">{user.email}</span>
            <div>
              {isEmailConfirmed ? (
                <Badge tone="good">メールアドレス確認済み</Badge>
              ) : (
                <Badge tone="warning">メールアドレス未確認</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">パスワード</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                定期的な変更をおすすめします。
              </p>
            </div>
            <ChangePasswordForm />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="セッション" />
        <Card>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              ログアウト
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}
