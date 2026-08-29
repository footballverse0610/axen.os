/**
 * CSVエクスポート用の純粋関数群(RFC 4180準拠)。
 * DB/認証には一切依存しないため、単体でテスト可能。
 */

/**
 * ダウンロードしたファイルをExcel(特にWindows版)で開いても文字化けしないように
 * 先頭へ付与するUTF-8 BOM。ソースコード上に不可視文字を直接埋め込まず、
 * 文字コード(U+FEFF)から明示的に生成する。
 */
export const UTF8_BOM = String.fromCharCode(0xfeff);

/**
 * Excel等のスプレッドシートソフトが数式の開始とみなす先頭文字。
 * これらで始まる値をそのまま出力すると、CSVを開いたアプリ側で
 * 意図しない数式として評価される(CSVインジェクション)おそれがある。
 */
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@"];

/**
 * CSVインジェクション対策: 値が上記のいずれかの文字で始まる場合、
 * 先頭にシングルクォート(')を1つ付与し、数式として解釈されないようにする
 * (Excel等でこの値が文字列として扱われる、広く使われている対策)。
 * 該当しない値は一切変更しない。
 */
function neutralizeFormulaPrefix(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGER_CHARS.includes(value[0])) {
    return `'${value}`;
  }
  return value;
}

/**
 * 1フィールドをCSV用にエスケープする。
 * まずCSVインジェクション対策(neutralizeFormulaPrefix)を適用し、
 * その結果に対してカンマ・ダブルクォート・改行(\n または \r)のいずれかを
 * 含む場合のみダブルクォートで囲み、内部のダブルクォートは""に置き換える。
 * 該当しない場合(空文字含む)はそのまま返す。
 */
export function escapeCsvField(value: string): string {
  const safeValue = neutralizeFormulaPrefix(value);
  if (/[",\n\r]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

/** 1行分のフィールド配列をCSVの1行(カンマ区切り)に変換する。 */
export function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",");
}

/** ヘッダー行を含む複数行をCRLF区切りのCSV文字列に変換する。 */
export function buildCsv(rows: string[][]): string {
  return rows.map(toCsvRow).join("\r\n");
}
