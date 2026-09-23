import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 起業しよ。",
  description: "「起業しよ。」が取り扱う情報の種類と利用目的について説明します。",
};

const LAST_UPDATED = "2026年9月20日";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 起業しよ。 トップへ戻る
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          プライバシーポリシー
        </h1>
        <p className="text-xs text-muted-foreground">最終更新日: {LAST_UPDATED}</p>
      </header>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          本ページは、「起業しよ。」（Web版およびAndroidアプリ版。以下「本アプリ」）が実際に取り扱っている情報の種類と利用目的を、現在の実装内容に基づいてご説明するものです。法律の専門家による正式な法的助言や、法令遵守の保証を目的としたものではありません。
        </p>
      </div>

      <Section title="1. 事業者について">
        <p>
          本アプリ「起業しよ。」は、アイデアを実際のビジネスに変えることを支援する個人向けアプリです。Android版はCapacitorを用いてWeb版と同一の機能・同一のサーバーをそのまま表示するもので、Android版独自の追加データ収集は行っていません。
        </p>
      </Section>

      <Section title="2. 収集する情報">
        <p>本アプリでは、ご利用にあたり以下の情報を保存しています。</p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-medium text-foreground">アカウント情報</p>
            <p>
              メールアドレスとパスワードは、認証基盤であるSupabase社のサービスを通じて管理されます（パスワードは本アプリのサーバーには平文で保存されません）。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">プロフィール・初回登録時の回答</p>
            <p>
              表示名、アバター画像、初回登録（オンボーディング）時に入力いただく「変えたいこと」「現在の状態」「3ヶ月後の目標」「1日に使える時間」「AIコーチに求めること」などの回答内容。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">事業・ビジネスアイデア情報</p>
            <p>
              事業名、業種、事業のステージ、一言紹介、設立日、およびビジネスアイデアのタイトル・説明・進捗ステージ。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">タスク・目標</p>
            <p>タスクのタイトル・説明・期限・優先度・カテゴリ、および目標のタイトル・種別・目標値・進捗状況。</p>
          </div>
          <div>
            <p className="font-medium text-foreground">売上・経費の記録</p>
            <p>
              売上・経費として入力された金額、カテゴリ、取引先/顧客名、日付などの財務情報。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">AI Coachとの会話内容</p>
            <p>
              AI Coach機能でユーザーが送信したメッセージと、それに対するAIの応答は、会話履歴として保存されます。
            </p>
          </div>
        </div>
      </Section>

      <Section title="3. 情報の利用目的">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>ダッシュボード・タスク管理・財務管理・目標管理など、本アプリの各機能を提供するため</li>
          <li>
            AI Coach機能をご利用いただいた際に、入力いただいたメッセージと、上記の事業データ（直近の売上・経費の集計、未完了タスクの一部、ビジネスアイデアの一部、進行中の目標の一部、初回登録時の回答）を要約した内容を、回答生成のためにAnthropic社のClaude APIへ送信するため
          </li>
          <li>アカウントの認証・セッション維持のため</li>
        </ul>
      </Section>

      <Section title="4. 第三者への提供・委託">
        <p>本アプリは、以下のサービス提供事業者に情報の処理を委託しています。</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-medium text-foreground">Supabase, Inc.</span>
            　— データベース・ユーザー認証基盤として、アカウント情報を含む上記すべてのデータを保存
          </li>
          <li>
            <span className="font-medium text-foreground">Anthropic, PBC</span>
            　— AI Coach機能のため、送信したメッセージと事業データの要約をClaude APIへ送信
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel Inc.</span>
            　— Webアプリケーションのホスティング
          </li>
        </ul>
        <p>
          上記以外の広告配信・アクセス解析（アナリティクス）・トラッキング目的の第三者サービスは、本アプリには組み込まれていません。
        </p>
      </Section>

      <Section title="5. Cookie等について">
        <p>
          本アプリは、ログイン状態を維持するための認証用Cookieのみを使用しています。広告配信や行動追跡を目的としたCookie・SDKは使用していません。Android版においても、これらはWebViewを通じて同様に扱われるのみで、Android版独自のトラッキングは行っていません。
        </p>
      </Section>

      <Section title="6. データの保存期間・削除">
        <p>
          入力いただいた情報は、アカウントが存在する限り保存されます。アプリ内の「設定」画面から、いつでもご自身でアカウントを削除できます。アカウントを削除すると、プロフィール・事業・アイデア・タスク・目標・売上/経費の記録・AI
          Coachとの会話履歴を含むすべてのデータが直ちに完全に削除され、元に戻すことはできません。
        </p>
      </Section>

      <Section title="7. 未成年の方のご利用について">
        <p>
          本アプリは現時点で年齢確認の仕組みを設けていません。保護者の同意が必要な場合は、保護者の方の管理のもとでご利用ください。
        </p>
      </Section>

      <Section title="8. 本ポリシーの変更について">
        <p>
          本アプリの機能追加・変更に伴い、取り扱う情報の内容は変わることがあります。本ページの内容は随時更新される場合があります。
        </p>
      </Section>

      <Section title="9. お問い合わせ">
        <p>
          本ページに関するお問い合わせ、またはデータ削除のご希望については、開発者までご連絡ください（お問い合わせ窓口は準備中です）。
        </p>
      </Section>
    </main>
  );
}
