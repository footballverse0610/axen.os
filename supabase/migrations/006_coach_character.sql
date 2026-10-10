-- =============================================================================
-- 起業しよ。: AIコーチの性格(4キャラクター)選択を保存する列を追加
--
-- ユーザーごとに選択したAIコーチの性格(ソウ=共感型/レオ=論理型/
-- ガク=行動型/リク=率直型)をprofilesに保存する。値の定義・表示名・
-- システムプロンプトへの反映内容はsrc/lib/coach/characters.tsを単一の
-- 情報源とする。
--
-- 新しい列はNOT NULL + 定数DEFAULTのため、既存行もそのまま
-- デフォルト値('sou')で埋まり、エラーは発生しない
-- (既存ユーザーは引き続き正常に利用でき、未選択状態でも適切な
-- デフォルト性格が設定される)。
--
-- RLSは行単位(profiles_select_own等、既存4ポリシー)であり、
-- 新しい列にも自動的に適用されるため、RLSポリシーの追加・変更は不要。
-- =============================================================================

begin;

create type coach_character as enum ('sou', 'leo', 'gaku', 'riku');

alter table profiles
  add column coach_character coach_character not null default 'sou';

comment on column profiles.coach_character is
  'ユーザーが選択したAIコーチの性格。sou=共感型/leo=論理型/gaku=行動型/riku=率直型。未選択ユーザーはsou(デフォルト)。';

commit;
