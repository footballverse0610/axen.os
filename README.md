# Axen OS

スポーツネックレスブランド「Axen Gear」を一人で運営するための、ブランド経営ダッシュボード。

## 現在のフェーズ

**Phase 1: プロジェクト基盤**

Next.js + TypeScript + Tailwind CSS の基本構成のみ。Dashboard・Supabase連携・認証・AI機能は未実装。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase（Phase 2以降で導入予定）
- AI機能（Phase 3以降で導入予定）

## セットアップ

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
npm run lint    # ESLint実行
```

## 今後の実装予定

- Supabase（DB / Auth）
- Dashboard / Products / Profit / Sales / Inventory / Tasks
- AI機能（AI Product Lab / Content AI / Business AI / AI CEO）
