# Founder（仮称）

アイデアを、実際のビジネスに変えるためのAIビジネス支援アプリ。
起業志望者・学生起業家・副業を始めたい人・個人事業主・小規模事業者を対象とする。

## 現在のフェーズ

**Phase 1: 基盤 + UI（仮データ）**

Next.js + TypeScript + Tailwind CSS で、以下5画面のUIのみを実装済み。
バックエンド・Supabase連携・認証・AI APIは未実装（仮データで表示）。

- Dashboard
- Business Ideas
- Tasks
- Finance（Sales / Expenses / Profit）
- AI Business Coach（チャットUIのみ、送信不可）

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- lucide-react（アイコン）
- Supabase（Phase 2以降で導入予定）
- AI機能（Phase 3以降で導入予定）

## セットアップ

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。スマートフォン表示ではボトムナビ、デスクトップ表示ではサイドバーになります。

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
npm run lint    # ESLint実行
```

## 今後の実装予定

- Supabase（DB / Auth）
- 各画面のCRUD・データ永続化
- AI Business Coach（AI API接続）
Vercel deployment test

## Supabase Auth設定（本番環境）

本番（Vercel）環境でメール確認・パスワード再設定のリンクが正しく機能するために、
コード側の設定に加えて **Supabase Dashboard側の設定が別途必要** です。
この設定はコードから変更できないため、Supabase Dashboardで手動確認・設定してください。

対象: Supabase Dashboard > Authentication > URL Configuration

- **Site URL**: 本番のVercel URL（例: `https://<production-domain>.vercel.app`、
  独自ドメインを使う場合はそのドメイン）を設定する。開発用の`http://localhost:3000`や
  古いpreview URLのままになっていないか確認すること。
- **Redirect URLs**（許可リスト）: 上記の本番URL配下（少なくとも
  `https://<production-domain>.vercel.app/auth/confirm`と
  `https://<production-domain>.vercel.app/update-password`）を追加する。
  ここに登録されていないURLへは、Supabaseがメール内リンクのリダイレクトを許可しない。
  開発環境用に`http://localhost:3000/**`も別途登録して構わない（本番用の値を
  上書きしないよう、両方を並記する）。

対象: Supabase Dashboard > Authentication > Email Templates

このアプリは`src/app/auth/confirm/route.ts`でtoken_hash + verifyOtp方式
（Supabase公式のNext.js SSR向け推奨パターン）を実装しています。
デフォルトの`{{ .ConfirmationURL }}`を使うテンプレートのままだと、
Supabaseがホストする確認ページを経由してしまい、このアプリの
`/auth/confirm`を通らないため、以下の形式にテンプレートを変更する必要があります。

- **Confirm signup**（新規登録の確認メール）:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/
  ```
- **Reset Password**（パスワード再設定メール）:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
  ```

`next`パラメータは`/`で始まる相対パスのみ受け付けます（オープンリダイレクト対策。
`src/app/auth/confirm/route.ts`の`resolveSafeNextPath()`を参照）。
`next`を省略した場合は`/update-password`にフォールバックするため、
signup確認メールのテンプレートでは`next=/`を明示的に指定してください。

## AdMob設定（本番環境）

Android版アプリの設定（Settings）画面にのみ、バナー広告（Google AdMob）を実装
しています。現在のコードはGoogle公式のテスト広告ID
（https://developers.google.com/admob/android/test-ads）を既定値として使用して
おり、本番のAdMob IDへ切り替えるまでは、実機で表示される広告はすべてテスト広告
です（誤タップしてもGoogle広告主に課金されません）。

本番のAdMob IDへ切り替えるには、以下の**2箇所**の設定が必要です。どちらか一方
だけを設定するとテスト広告と本番広告が混在した状態になるため、**必ず両方を同時
に設定してください**。

1. **バナー広告のAd Unit ID**（Vercelの環境変数）
   AdMob管理画面で発行したバナー広告ユニットID
   （`ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx`の形式）を、Vercel Dashboard >
   Settings > Environment Variables で、Production環境の
   `NEXT_PUBLIC_ADMOB_BANNER_AD_UNIT_ID` に設定する（`.env.example`参照）。
   この値は秘密情報ではない（配布したAPKを解析すれば誰でも読み取れる）ため、
   `NEXT_PUBLIC_`を付けてクライアントに公開する設計で問題ない。

2. **AdMob App ID**（GitHub Actions Secrets）
   AdMob管理画面で発行したApp ID（`ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx`の
   形式）を、GitHubリポジトリ > Settings > Secrets and variables > Actions で、
   `ADMOB_APP_ID`という名前のRepository Secretとして追加する（既存のRelease
   署名用Secrets、`ANDROID_KEYSTORE_BASE64`等と同じ場所）。
   `mobile/android/app/build.gradle`がビルド時にこの環境変数を読み込み、
   `mobile/android/app/src/main/AndroidManifest.xml`へmanifest placeholder経由
   で注入する。現時点では`.github/workflows/android-build.yml`はこのSecretを
   ビルドへ渡していないため、本番公開前に、Release AABをビルドするstepの`env:`
   に`ADMOB_APP_ID: ${{ secrets.ADMOB_APP_ID }}`を追加すること。
