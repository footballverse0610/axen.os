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
