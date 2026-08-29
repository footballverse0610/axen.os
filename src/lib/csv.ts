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
 * 1フィールドをCSV用にエスケープする。
 * カンマ・ダブルクォート・改行(\n または \r)のいずれかを含む場合のみ
 * ダブルクォートで囲み、内部のダブルクォートは""に置き換える。
 * 該当しない場合(空文字含む)はそのまま返す。
 */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 1行分のフィールド配列をCSVの1行(カンマ区切り)に変換する。 */
export function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",");
}

/** ヘッダー行を含む複数行をCRLF区切りのCSV文字列に変換する。 */
export function buildCsv(rows: string[][]): string {
  return rows.map(toCsvRow).join("\r\n");
}
