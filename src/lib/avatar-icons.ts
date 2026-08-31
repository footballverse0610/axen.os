/**
 * プロフィールアイコンの選択肢(絵文字)。既存のSupabase Storage等の外部
 * アップロード基盤はこのコードベースに存在しないため、新しい外部サービスを
 * 追加せずに済む「絵文字1文字を選ぶ」方式にする。avatar_url列はURL用に
 * 見える名前だが、画像URLとしては使わず、選んだ絵文字をそのまま保存する
 * (Header等の表示側もURLとしてではなく、そのままテキストとして表示する)。
 *
 * "use server" ファイル(profile-actions.ts)は非同期関数以外をexportできない
 * (React/Next.jsの制約)ため、クライアントコンポーネントからも参照するこの
 * 定数はプレーンなモジュールに分離している。
 */
export const AVATAR_ICON_OPTIONS = [
  "😀",
  "😎",
  "🚀",
  "🌱",
  "🔥",
  "💡",
  "🎯",
  "☕",
  "🐣",
  "🦊",
] as const;
export type AvatarIcon = (typeof AVATAR_ICON_OPTIONS)[number];
