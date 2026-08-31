/**
 * 「1万」「1.5万」「1億」のような日本語の数値表記(万/億)を含む文字列を、
 * プレーンな数値へ変換する。Goalsの目標値・現在値の入力補助として使う。
 *
 * 対応するのは「数値(小数可) + 万 or 億」の単一の単位のみ。
 * 「1万2千」のような複合表記は非対応(null を返す = 入力エラー扱い)。
 */
export function parseJapaneseNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "");

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  const match = normalized.match(/^(-?\d+(?:\.\d+)?)(万|億)$/);
  if (!match) return null;

  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;

  const unit = match[2] === "万" ? 10_000 : 100_000_000;
  const value = base * unit;
  return Number.isFinite(value) ? value : null;
}

/**
 * 大きな数値を「1.5万」「2億」のような読みやすい表記に整形する
 * (入力欄の下に表示する変換結果ヒント用。保存する値そのものは常にプレーンな数値のまま)。
 */
export function formatJapaneseNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);

  if (abs >= 100_000_000) {
    return `${trimTrailingZeros(value / 100_000_000)}億`;
  }
  if (abs >= 10_000) {
    return `${trimTrailingZeros(value / 10_000)}万`;
  }
  return value.toLocaleString("ja-JP");
}

function trimTrailingZeros(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}
