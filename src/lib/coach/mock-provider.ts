import "server-only";
import type { CoachContext } from "../supabase/coach-context";

/**
 * 開発・テスト専用のMock Coach Provider。
 * Anthropic APIを一切呼び出さず、事業データを踏まえたそれっぽい日本語の
 * テスト用回答を生成し、実際のストリーミングAPIと同じ「小さなチャンクを
 * 少し間隔を空けて返す」挙動を再現する。
 *
 * このモジュール自体はisCoachMockModeEnabled()による呼び出し制御に依存しない
 * (呼び出し側のsrc/lib/coach/provider.tsが判定してから呼ぶ)。
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TOPIC_REPLIES: { keywords: string[]; body: (business: string) => string }[] = [
  {
    keywords: ["価格", "値段", "料金", "単価"],
    body: (business) =>
      `価格設定は「原価+利益」だけでなく、顧客が感じる価値からも逆算してみましょう。${business}の場合、競合と横並びの価格にするより、提供価値を1つでも言語化してから金額に反映すると納得感が生まれます。まずは既存顧客に「もう少し高くても頼みたい理由」を聞いてみるのも良い方法です。`,
  },
  {
    keywords: ["集客", "マーケティング", "宣伝", "広告"],
    body: (business) =>
      `集客はまず「誰の、どんな悩みを解決するか」を一文で言えるかがポイントです。${business}の強みが伝わる場を1つに絞り、そこで小さく試して反応を見てから広げるのがおすすめです。SNS・紹介・既存顧客への声かけのうち、今一番反応が早く得られそうなチャネルはどれですか?`,
  },
  {
    keywords: ["タスク", "優先", "忙しい", "時間"],
    body: () =>
      `タスクが多いときは、「売上に直結するか」「今日やらないと機会損失になるか」の2軸で並べ替えると優先順位が見えやすくなります。すべてを完璧にこなそうとせず、今週いちばんインパクトが大きい1つに絞って着手するのがおすすめです。`,
  },
  {
    keywords: ["資金", "お金", "経費", "利益"],
    body: (business) =>
      `${business}の収支を見ながら、固定費と変動費を分けて考えると打ち手が立てやすくなります。まずは削れる経費より、利益率の高い商品・サービスに時間を再配分できないかを検討してみましょう。`,
  },
];

const DEFAULT_REPLIES: ((business: string) => string)[] = [
  (business) =>
    `ご相談ありがとうございます。${business}の状況を踏まえると、まずは小さく試せる一歩から始めるのが良さそうです。具体的にどの部分が一番気になっていますか?もう少し詳しく教えていただければ、次のアクションを一緒に整理します。`,
  (business) =>
    `なるほど、${business}にとって重要なポイントですね。完璧を目指すより、今週中に検証できる小さな仮説を1つ立てて動いてみるのがおすすめです。どんな結果が出たら「うまくいった」と言えそうか、先に決めておくと振り返りがしやすくなります。`,
];

function pickTemplate(userMessage: string, businessName: string): string {
  const matched = TOPIC_REPLIES.find((t) => t.keywords.some((k) => userMessage.includes(k)));
  if (matched) {
    return matched.body(businessName);
  }
  const fallback = DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
  return fallback(businessName);
}

/** テキストを小さなチャンクへ分割する(2〜4文字単位。実際のトークン単位ストリーミングを模す) */
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const size = 2 + Math.floor(Math.random() * 3);
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Mock版のストリーミング応答を生成する。実プロバイダ(src/lib/anthropic経由)と
 * 同じ「asyncイテレータでテキストチャンクをyieldする」インターフェースにして、
 * 呼び出し側(src/lib/coach/provider.ts)がProviderを意識せず扱えるようにする。
 */
export async function* streamMockCoachReply(params: {
  userMessage: string;
  context: CoachContext;
}): AsyncGenerator<string> {
  const businessName = params.context.business.name;
  const replyText = `[開発用モック応答]\n${pickTemplate(params.userMessage, businessName)}`;

  for (const chunk of splitIntoChunks(replyText)) {
    await sleep(15 + Math.floor(Math.random() * 25));
    yield chunk;
  }
}
