import type { BusinessIdea, CoachMessage, Task, Transaction } from "./types";

/**
 * Phase 1 の仮データ。バックエンド未実装のためUI確認用に固定値を返す。
 */

export const mockIdeas: BusinessIdea[] = [
  {
    id: "idea-1",
    title: "サブスク型パーソナル栄養コーチ",
    description: "食事写真をAIが解析し、週次で最適な献立を提案するサービス。",
    stage: "validating",
    potentialScore: 78,
    createdAt: "2026-08-10",
  },
  {
    id: "idea-2",
    title: "学生向けフリーランス案件マッチング",
    description: "地方大学の学生と地元企業の軽作業案件をつなぐプラットフォーム。",
    stage: "draft",
    potentialScore: 54,
    createdAt: "2026-08-18",
  },
  {
    id: "idea-3",
    title: "ハンドメイドアクセサリーの越境EC",
    description: "国内作家の商品を東南アジア市場向けに展開するEC事業。",
    stage: "building",
    potentialScore: 66,
    createdAt: "2026-07-29",
  },
  {
    id: "idea-4",
    title: "中小企業向け経理自動化SaaS",
    description: "レシート撮影だけで仕訳が完了する経理支援ツール。",
    stage: "launched",
    potentialScore: 88,
    createdAt: "2026-06-02",
  },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "競合3社の価格リサーチ",
    description: "類似サービスの料金プランを比較表にまとめる。",
    dueDate: "2026-08-26",
    priority: "HIGH",
    category: "マーケティング",
    done: false,
  },
  {
    id: "task-2",
    title: "LP用のキャッチコピー案を作成",
    dueDate: "2026-08-26",
    priority: "HIGH",
    category: "商品",
    done: false,
  },
  {
    id: "task-3",
    title: "既存顧客3名にヒアリング",
    dueDate: "2026-08-27",
    priority: "MEDIUM",
    category: "営業",
    done: false,
  },
  {
    id: "task-4",
    title: "月次の資金繰り表を更新",
    dueDate: "2026-08-28",
    priority: "MEDIUM",
    category: "資金調達",
    done: false,
  },
  {
    id: "task-5",
    title: "領収書を経費フォルダに整理",
    dueDate: "2026-08-25",
    priority: "LOW",
    category: "運営",
    done: true,
  },
];

export const mockTransactions: Transaction[] = [
  { id: "tx-1", type: "sale", label: "オンライン講座 販売", category: "商品売上", amount: 32000, date: "2026-08-24" },
  { id: "tx-2", type: "sale", label: "コンサル契約(月額)", category: "サービス売上", amount: 45000, date: "2026-08-20" },
  { id: "tx-3", type: "sale", label: "物販 EC 売上", category: "商品売上", amount: 18500, date: "2026-08-18" },
  { id: "tx-4", type: "expense", label: "広告費(SNS運用)", category: "マーケティング", amount: 15000, date: "2026-08-22" },
  { id: "tx-5", type: "expense", label: "サーバー・ツール利用料", category: "運営費", amount: 6800, date: "2026-08-15" },
  { id: "tx-6", type: "expense", label: "外注デザイン費", category: "外注費", amount: 12000, date: "2026-08-12" },
];

export const mockCoachConversation: CoachMessage[] = [
  {
    id: "msg-1",
    role: "coach",
    content:
      "こんにちは。直近のタスクを見ると「LP用のキャッチコピー案」が期限間近です。まずはターゲット顧客の悩みを一言で表すことから始めましょう。",
  },
  {
    id: "msg-2",
    role: "user",
    content: "ターゲットは30代の個人事業主です。何から手をつければいいですか?",
  },
  {
    id: "msg-3",
    role: "coach",
    content:
      "その場合「本業に集中したいのに雑務に追われる」という悩みが刺さりやすい傾向があります。既存顧客へのヒアリング結果と合わせて言葉を磨き込みましょう。",
  },
];

export const suggestedPrompts: string[] = [
  "今週優先すべきタスクを整理して",
  "このアイデアの市場規模を一緒に考えて",
  "価格設定のアドバイスが欲しい",
];
