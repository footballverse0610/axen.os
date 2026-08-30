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
