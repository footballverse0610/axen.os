import type Anthropic from "@anthropic-ai/sdk";

/**
 * AIコーチの回答に「タスク/目標/アイデアとして追加できる提案」を構造化データとして
 * 持たせるための仕組み。
 *
 * 設計方針: 通常の会話テキストから正規表現等で無理に抽出するのではなく、
 * Claudeに「propose_actions」というツール呼び出しとして提案を出させ、
 * サーバー側(sanitizeCoachActions)で必ず再検証してから使う。
 *
 * ストリーミングへの載せ方: 既存の/api/coachは単純なプレーンテキストの
 * チャンクストリームのため、新しいプロトコルを導入する代わりに、
 * 通常の会話テキストが終わった後に「マーカー文字列 + JSON」を最後の1チャンクとして
 * 追加するだけにする(既存のテキストストリーミング表示を壊さない最小限の拡張)。
 * マーカーはNUL文字を含むため、モデルの通常の会話テキストに出現することはない。
 */
export const COACH_ACTIONS_MARKER = "\u0000COACH_ACTIONS\u0000";

export interface CoachSuggestedTask {
  title: string;
  description: string | null;
  /** YYYY-MM-DD。AIが明確な期限を示していない場合は必ずnull。 */
  dueDate: string | null;
}

export interface CoachSuggestedGoal {
  title: string;
  description: string | null;
  targetValue: number;
  unit: string | null;
  /** YYYY-MM-DD。AIが明確な期限を示していない場合は必ずnull。 */
  targetDate: string | null;
}

export interface CoachSuggestedIdea {
  title: string;
  description: string | null;
}

export interface CoachActions {
  tasks: CoachSuggestedTask[];
  goals: CoachSuggestedGoal[];
  ideas: CoachSuggestedIdea[];
}

export const EMPTY_COACH_ACTIONS: CoachActions = { tasks: [], goals: [], ideas: [] };

export function hasAnyCoachActions(actions: CoachActions): boolean {
  return actions.tasks.length > 0 || actions.goals.length > 0 || actions.ideas.length > 0;
}

// 既存のtask-actions.ts/goal-actions.ts/idea-actions.tsの文字数上限と揃える
// (これらは"use server"ファイルでクライアントからimportできないため、
// 同じ値をここに複製している)。
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_UNIT_LENGTH = 20;

/** 1回の提案で追加できる件数の上限(AIの暴走・誤爬生成からの防御)。 */
const MAX_TASKS = 10;
const MAX_GOALS = 3;
const MAX_IDEAS = 3;

/**
 * goalsテーブルのtarget_value列(supabase/migrations/001_initial_schema.sql:
 * `numeric(12, 2)`)が実際に保持できる最大値と一致させる。既存の目標機能
 * (例: 1億円単位の売上目標)で使える値を根拠なく拒否しないよう、
 * DBの列定義そのものを上限の根拠にしている。
 */
const MAX_TARGET_VALUE = 9_999_999_999.99;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/** タイトルのように必須・完全一致が必要な文字列。不正な場合はnullを返し、呼び出し側でその項目ごと捨てる。 */
function sanitizeRequiredText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

/** 説明文のように任意かつ多少の揺れを許容してよい文字列。長すぎる場合は切り詰める。 */
function sanitizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 実在する暦日かどうかをカレンダー計算で直接判定する(Date.parseのタイム
 * ゾーン・実装依存の挙動には頼らない)。月13・日45・うるう年でない年の
 * 2月29日等を確実に除外する。
 */
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

/**
 * YYYY-MM-DD形式(月日は必ず2桁)かつ実在する日付のみ受理する。
 * 「今週中」のような曖昧な表現を日付へ変換するロジックは意図的に実装しない
 * (AIが明確な年月日を出力した場合のみ、ここを通過する)。
 */
function sanitizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = DATE_RE.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  return trimmed;
}

function sanitizeTargetValue(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > MAX_TARGET_VALUE) return null;
  return num;
}

/**
 * Claudeのtool_use.inputを信頼せず、既知の形・上限に収まる項目だけを残す。
 * 1件でも不正な項目はその項目だけを除外し(タイトル以外が多少崩れていても
 * タスク自体は救う方針)、全体を失敗させない。
 */
export function sanitizeCoachActions(raw: unknown): CoachActions {
  const obj = asRecord(raw);
  if (!obj) return EMPTY_COACH_ACTIONS;

  const tasks: CoachSuggestedTask[] = [];
  if (Array.isArray(obj.tasks)) {
    for (const item of obj.tasks) {
      if (tasks.length >= MAX_TASKS) break;
      const record = asRecord(item);
      if (!record) continue;
      const title = sanitizeRequiredText(record.title, MAX_TITLE_LENGTH);
      if (!title) continue;
      tasks.push({
        title,
        description: sanitizeOptionalText(record.description, MAX_DESCRIPTION_LENGTH),
        dueDate: sanitizeDate(record.due_date),
      });
    }
  }

  const goals: CoachSuggestedGoal[] = [];
  if (Array.isArray(obj.goals)) {
    for (const item of obj.goals) {
      if (goals.length >= MAX_GOALS) break;
      const record = asRecord(item);
      if (!record) continue;
      const title = sanitizeRequiredText(record.title, MAX_TITLE_LENGTH);
      const targetValue = sanitizeTargetValue(record.target_value);
      if (!title || targetValue === null) continue;
      goals.push({
        title,
        description: sanitizeOptionalText(record.description, MAX_DESCRIPTION_LENGTH),
        targetValue,
        unit: sanitizeOptionalText(record.unit, MAX_UNIT_LENGTH),
        targetDate: sanitizeDate(record.target_date),
      });
    }
  }

  const ideas: CoachSuggestedIdea[] = [];
  if (Array.isArray(obj.ideas)) {
    for (const item of obj.ideas) {
      if (ideas.length >= MAX_IDEAS) break;
      const record = asRecord(item);
      if (!record) continue;
      const title = sanitizeRequiredText(record.title, MAX_TITLE_LENGTH);
      if (!title) continue;
      ideas.push({
        title,
        description: sanitizeOptionalText(record.description, MAX_DESCRIPTION_LENGTH),
      });
    }
  }

  return { tasks, goals, ideas };
}

/**
 * ストリームの生テキストから、表示用メッセージ本文と行動提案(JSON文字列)を分離する。
 * マーカーが無ければ全文がメッセージ本文、行動提案はなし。
 */
export function splitCoachStreamText(rawText: string): {
  displayText: string;
  actionsJson: string | null;
} {
  const markerIndex = rawText.indexOf(COACH_ACTIONS_MARKER);
  if (markerIndex === -1) {
    return { displayText: rawText, actionsJson: null };
  }
  return {
    displayText: rawText.slice(0, markerIndex),
    actionsJson: rawText.slice(markerIndex + COACH_ACTIONS_MARKER.length),
  };
}

/**
 * textの末尾が、マーカーの先頭部分と部分一致していないかを調べる。
 * ネットワーク境界でマーカーが複数チャンクに分割されて届いた場合に、
 * ストリーミング中の画面表示からその「マーカーかもしれない末尾」だけを
 * 一時的に保留するために使う。戻り値は保留すべき文字数(0なら保留不要)。
 *
 * マーカーはNUL文字(\u0000)から始まるため、通常の会話テキストの末尾が
 * これと部分一致することは実質的に起こらない。そのため、マーカーが
 * 存在しない通常の応答では常に0を返し、末尾の文字が不必要に保留されることはない。
 */
export function pendingMarkerSuffixLength(text: string): number {
  const maxLen = Math.min(COACH_ACTIONS_MARKER.length - 1, text.length);
  for (let len = maxLen; len > 0; len--) {
    if (text.endsWith(COACH_ACTIONS_MARKER.slice(0, len))) {
      return len;
    }
  }
  return 0;
}

/**
 * ストリーミング中(まだ全文を受信し終えていない時点)に、今安全に表示してよい
 * テキストを計算する。マーカーが既に完全な形で見つかった場合はその手前まで、
 * 見つからない場合はpendingMarkerSuffixLength()で求めた「マーカーの可能性がある
 * 末尾」だけを除いたテキストを返す(保留分は次のチャンクで再評価される)。
 *
 * ストリーム終了後の最終確定処理には使わない(splitCoachStreamTextを使うこと)。
 * ストリームが完全に終わった時点では「マーカーかもしれない末尾」はもはや
 * マーカーではあり得ない(続きが来ないため)ので、保留せず全文を表示してよい。
 */
export function computeStreamingDisplayText(rawText: string): string {
  const markerIndex = rawText.indexOf(COACH_ACTIONS_MARKER);
  if (markerIndex !== -1) {
    return rawText.slice(0, markerIndex);
  }
  const pendingLength = pendingMarkerSuffixLength(rawText);
  return pendingLength === 0 ? rawText : rawText.slice(0, rawText.length - pendingLength);
}

/** Claudeに渡すツール定義。会話の返答そのものではなく、提案候補の構造化だけに使う。 */
export const PROPOSE_ACTIONS_TOOL: Anthropic.Tool = {
  name: "propose_actions",
  description:
    "ユーザーへの返答の中で、タスク・目標・事業アイデアとして追加できる具体的な提案をした場合にだけ呼び出す。" +
    "通常の会話の返答はこのツールとは別に、必ず自然な文章で行う(このツールは返答の代わりにはならない)。" +
    "はっきりした行動・目標・アイデアの提案がない場合は呼び出さない。" +
    "期限(due_date/target_date)は、ユーザーまたはあなた自身が「今週中」「明日まで」のように文章中で明確な期限に" +
    "言及した場合のみYYYY-MM-DD形式で設定し、年月日が具体的に定まらない曖昧な表現の場合は絶対に推測で日付を" +
    "作らず省略すること。",
  input_schema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "追加できる具体的な行動の候補(提案が無ければ空配列)。",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "タスク名。短く具体的に(100文字以内)。" },
            description: { type: "string", description: "補足説明(不要なら省略)。" },
            due_date: {
              type: "string",
              description: "YYYY-MM-DD形式の期限。明確な期限が無い場合は省略する。",
            },
          },
          required: ["title"],
        },
      },
      goals: {
        type: "array",
        description: "設定できる具体的な目標の候補(提案が無ければ空配列)。",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "目標名。" },
            description: { type: "string", description: "補足説明(不要なら省略)。" },
            target_value: { type: "number", description: "目標の数値(例: 10人なら10)。" },
            unit: { type: "string", description: "単位(例: 人、円、件)。" },
            target_date: {
              type: "string",
              description: "YYYY-MM-DD形式の期限。明確な期限が無い場合は省略する。",
            },
          },
          required: ["title", "target_value"],
        },
      },
      ideas: {
        type: "array",
        description: "保存できる事業アイデアの候補(提案が無ければ空配列)。",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "アイデア名。" },
            description: { type: "string", description: "補足説明(不要なら省略)。" },
          },
          required: ["title"],
        },
      },
    },
  },
};
