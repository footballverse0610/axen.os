import type { BusinessStage, GoalType } from "./supabase/types";

/**
 * 「何から始める？」診断(ホーム画面 → /start-guide)の質問・回答・提案ロジック。
 * UIから独立した純粋な関数群にして、単体テストしやすくしている。
 */

export type StartState = "no_idea" | "has_idea" | "has_product" | "selling" | "has_sales";
export type StartWant =
  | "sell_product"
  | "provide_service"
  | "grow_sns"
  | "build_app"
  | "undecided"
  | "other";
export type StartBlocker =
  | "no_idea"
  | "dont_know_what_to_do"
  | "no_money"
  | "cant_make_product"
  | "cant_get_customers"
  | "sns_not_growing"
  | "other";

export interface StartGuideAnswers {
  state: StartState;
  want: StartWant;
  wantOther: string;
  blocker: StartBlocker;
  blockerOther: string;
}

export const START_STATE_OPTIONS: { value: StartState; label: string }[] = [
  { value: "no_idea", label: "まだアイデアがない" },
  { value: "has_idea", label: "アイデアはある" },
  { value: "has_product", label: "商品やサービスが決まっている" },
  { value: "selling", label: "すでに販売している" },
  { value: "has_sales", label: "すでに売上がある" },
];

export const START_WANT_OPTIONS: { value: StartWant; label: string }[] = [
  { value: "sell_product", label: "商品を売りたい" },
  { value: "provide_service", label: "サービスを提供したい" },
  { value: "grow_sns", label: "SNSで発信したい" },
  { value: "build_app", label: "Webサービス・アプリを作りたい" },
  { value: "undecided", label: "まだ決まっていない" },
  { value: "other", label: "その他" },
];

export const START_BLOCKER_OPTIONS: { value: StartBlocker; label: string }[] = [
  { value: "no_idea", label: "アイデアがない" },
  { value: "dont_know_what_to_do", label: "何をすればいいか分からない" },
  { value: "no_money", label: "お金がない" },
  { value: "cant_make_product", label: "商品を作れない" },
  { value: "cant_get_customers", label: "集客できない" },
  { value: "sns_not_growing", label: "SNSが伸びない" },
  { value: "other", label: "その他" },
];

export interface StartGuideStep {
  icon: string;
  title: string;
  /** Taskへ追加する際のタイトル・カテゴリー(既存のtasksテーブルの列にそのまま対応) */
  taskTitle: string;
  taskCategory: string;
  /** 指定がある場合のみ「Goalを作成」ボタンを表示する */
  goal?: {
    title: string;
    goalType: GoalType;
    unit: string;
    targetValue?: number;
  };
}

export interface StartGuideRecommendation {
  category: string;
  headline: string;
  steps: StartGuideStep[];
}

const NO_IDEA: StartGuideRecommendation = {
  category: "no_idea",
  headline: "まずは、売りたいものを決めよう。",
  steps: [
    {
      icon: "💡",
      title: "アイデアを3つ書き出す",
      taskTitle: "起業アイデアを3つ書き出す",
      taskCategory: "商品",
    },
    {
      icon: "🎯",
      title: "誰のためのサービスか決める",
      taskTitle: "誰の悩みを解決したいか(ターゲット)を決める",
      taskCategory: "商品",
    },
    {
      icon: "🔎",
      title: "身近な人の困りごとを探す",
      taskTitle: "身近な人に困っていることを聞いてみる",
      taskCategory: "商品",
    },
  ],
};

const HAS_IDEA: StartGuideRecommendation = {
  category: "has_idea",
  headline: "アイデアを、形にする準備をしよう。",
  steps: [
    {
      icon: "🎯",
      title: "誰のための事業か決める",
      taskTitle: "ターゲット(誰のための事業か)を決める",
      taskCategory: "商品",
    },
    {
      icon: "🔍",
      title: "似たサービス(競合)を調べる",
      taskTitle: "競合を3社調べる",
      taskCategory: "商品",
    },
    {
      icon: "📦",
      title: "商品・サービスの内容を決める",
      taskTitle: "商品・サービスの内容を決める",
      taskCategory: "商品",
    },
  ],
};

const HAS_PRODUCT: StartGuideRecommendation = {
  category: "has_product",
  headline: "販売の準備を進めよう。",
  steps: [
    {
      icon: "💰",
      title: "価格を決める",
      taskTitle: "商品・サービスの価格を決める",
      taskCategory: "商品",
    },
    {
      icon: "🧮",
      title: "原価・利益を確認する",
      taskTitle: "原価と利益を計算する",
      taskCategory: "商品",
    },
    {
      icon: "🛒",
      title: "販売方法を決める",
      taskTitle: "販売方法(どこで・どうやって売るか)を決める",
      taskCategory: "営業",
    },
  ],
};

const SELLING: StartGuideRecommendation = {
  category: "selling",
  headline: "最初のお客さまを迎える準備をしよう。",
  steps: [
    {
      icon: "🛍️",
      title: "販売ページを作る",
      taskTitle: "販売ページ(SNS投稿でも可)を作る",
      taskCategory: "マーケティング",
    },
    {
      icon: "📱",
      title: "SNSを準備する",
      taskTitle: "SNSアカウントを準備する",
      taskCategory: "マーケティング",
    },
    {
      icon: "🤝",
      title: "最初のお客さまを獲得する",
      taskTitle: "最初のお客さまを探して声をかける",
      taskCategory: "営業",
      goal: {
        title: "最初の10人のお客さまを獲得する",
        goalType: "sales_count",
        unit: "件",
        targetValue: 10,
      },
    },
  ],
};

const HAS_SALES: StartGuideRecommendation = {
  category: "has_sales",
  headline: "売上を伸ばす土台を整えよう。",
  steps: [
    {
      icon: "📝",
      title: "売上を記録する",
      taskTitle: "今月の売上・経費をFinanceに記録する",
      taskCategory: "運営",
    },
    {
      icon: "📊",
      title: "利益を確認する",
      taskTitle: "売上から利益がいくら出ているか確認する",
      taskCategory: "運営",
    },
    {
      icon: "🎯",
      title: "次の売上目標を設定する",
      taskTitle: "次の売上目標を考える",
      taskCategory: "運営",
      goal: {
        title: "次の売上目標を達成する",
        goalType: "revenue",
        unit: "円",
      },
    },
  ],
};

const GROW_SNS: StartGuideRecommendation = {
  category: "grow_sns",
  headline: "発信を、習慣にしよう。",
  steps: [
    {
      icon: "🎯",
      title: "発信するターゲットを決める",
      taskTitle: "SNSで届けたい相手(ターゲット)を決める",
      taskCategory: "マーケティング",
    },
    {
      icon: "📝",
      title: "投稿テーマを決める",
      taskTitle: "投稿するテーマを3つ決める",
      taskCategory: "マーケティング",
    },
    {
      icon: "📅",
      title: "投稿を始める",
      taskTitle: "最初の投稿をする",
      taskCategory: "マーケティング",
    },
  ],
};

const BUILD_APP: StartGuideRecommendation = {
  category: "build_app",
  headline: "小さく作って、試そう。",
  steps: [
    {
      icon: "🎯",
      title: "誰のどんな悩みを解決するか決める",
      taskTitle: "誰のどんな悩みを解決するサービスか決める",
      taskCategory: "商品",
    },
    {
      icon: "✅",
      title: "必要最低限の機能に絞る",
      taskTitle: "最初に必要な機能を3つに絞る",
      taskCategory: "商品",
    },
    {
      icon: "🛠️",
      title: "まずは必要最低限のサービスを作る",
      taskTitle: "まずは必要最低限のサービスを作ってみる",
      taskCategory: "商品",
    },
  ],
};

/**
 * Q2「どんなことをしたい？」がSNS/Webサービスのように具体的な手段を
 * 示している場合はそちらを優先し、それ以外はQ1「今の状態」に応じた
 * 進捗ステージ別の提案を返す。
 */
export function getStartGuideRecommendation(
  answers: Pick<StartGuideAnswers, "state" | "want">,
): StartGuideRecommendation {
  if (answers.want === "grow_sns") return GROW_SNS;
  if (answers.want === "build_app") return BUILD_APP;

  switch (answers.state) {
    case "no_idea":
      return NO_IDEA;
    case "has_idea":
      return HAS_IDEA;
    case "has_product":
      return HAS_PRODUCT;
    case "selling":
      return SELLING;
    case "has_sales":
      return HAS_SALES;
  }
}

/** 既存のオンボーディングで選んだ事業ステージから、Q1の初期選択候補を推測する(確認は必須)。 */
export function suggestStartStateFromBusinessStage(stage: BusinessStage): StartState | null {
  switch (stage) {
    case "idea":
      return "has_idea";
    case "preparing":
      return "has_product";
    case "operating":
      return "selling";
    case "paused":
      return null;
  }
}

function resolveOtherLabel(value: string, other: string, fallbackLabel: string): string {
  if (value === "other" && other.trim()) return other.trim();
  return fallbackLabel;
}

/** AIコーチへの相談導線(/coach)に渡す、質問への回答を要約したプロンプト文を組み立てる。 */
export function buildStartGuideAiPrompt(
  answers: StartGuideAnswers,
  industry: string | null,
): string {
  const stateLabel = START_STATE_OPTIONS.find((o) => o.value === answers.state)?.label ?? "";
  const wantOption = START_WANT_OPTIONS.find((o) => o.value === answers.want);
  const wantLabel = resolveOtherLabel(answers.want, answers.wantOther, wantOption?.label ?? "");
  const blockerOption = START_BLOCKER_OPTIONS.find((o) => o.value === answers.blocker);
  const blockerLabel = resolveOtherLabel(
    answers.blocker,
    answers.blockerOther,
    blockerOption?.label ?? "",
  );

  const industryLine = industry ? `業種：${industry}\n` : "";

  return (
    `${industryLine}起業の状況：${stateLabel}\n` +
    `やりたいこと：${wantLabel}\n` +
    `今困っていること：${blockerLabel}\n\n` +
    `これを踏まえて、今すぐやるべきことを具体的な行動レベルで3つ教えてください。`
  );
}
