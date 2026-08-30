-- =============================================================================
-- 起業しよ。/ Axen OS onboarding profile fields
--
-- 001_initial_schema.sql は変更しない。profiles テーブルへの列追加のみ。
-- RLS は行単位(profiles_select_own 等、既存4ポリシー)であり、
-- 新しい列にも自動的に適用されるため、RLSポリシーの追加・変更は不要。
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. ENUM型(新規オンボーディングの単一選択項目)
-- -----------------------------------------------------------------------------
create type onboarding_current_state as enum (
  'serious',                  -- 本気で変わりたい
  'has_goal_but_inconsistent', -- 目標はあるけど続かない
  'unsure',                   -- 何をしたいか分からない
  'passive',                  -- なんとなく毎日を過ごしている
  'gradual'                   -- 少しずつ変わりたい
);

create type onboarding_available_time as enum (
  'min_5_10',   -- 5〜10分
  'min_15_30',  -- 15〜30分
  'min_30_60',  -- 30〜60分
  'hour_plus'   -- 1時間以上
);

-- -----------------------------------------------------------------------------
-- 2. profiles への列追加
-- -----------------------------------------------------------------------------
-- main_goals / coach_preferences は複数選択のため text[]。
-- 選択肢の妥当性はアプリ側(src/lib/onboarding-options.ts)で検証する
-- (task_category等の単一選択ENUMと異なり、複数選択ENUM配列は運用上の
-- 変更コストが高いため、他のfree-text列(sales.category等)と同様に
-- アプリ層でのバリデーションを採用する)。
alter table profiles
  add column main_goals text[] not null default '{}',
  add column current_state onboarding_current_state,
  add column three_month_goal text,
  add column available_time onboarding_available_time,
  add column coach_preferences text[] not null default '{}';

comment on column profiles.onboarding_completed is
  '初回オンボーディング(人生の目標・現状のヒアリング、/welcome)を完了したか';
comment on column profiles.main_goals is
  'オンボーディングSTEP2「今、一番変えたいことは？」で選択した項目(複数選択)';
comment on column profiles.current_state is
  'オンボーディングSTEP3「今の自分に一番近いのは？」で選択した項目(単一選択)';
comment on column profiles.three_month_goal is
  'オンボーディングSTEP4「3ヶ月後、どうなっていたい？」の自由記述';
comment on column profiles.available_time is
  'オンボーディングSTEP5「1日にどれくらい時間を使えそう？」で選択した項目(単一選択)';
comment on column profiles.coach_preferences is
  'オンボーディングSTEP6「AIコーチに何をしてほしい？」で選択した項目(複数選択)';

-- -----------------------------------------------------------------------------
-- 3. 既存ユーザーのバックフィル
-- -----------------------------------------------------------------------------
-- onboarding_completedは元々全ユーザーfalseのまま未使用だった。今回から
-- 実際にルーティングを制御する値として使い始めるため、このmigration適用前から
-- 既に事業(businesses)を作成済み=既にアプリを使い始めているユーザーについては、
-- 新しい人生目標ヒアリングを強制せず「完了済み」扱いにする。
-- (新規ユーザー・まだ事業を作成していないユーザーはfalseのままなので、
--  次回ログイン時に新しい/welcomeへ案内される)
update profiles
set onboarding_completed = true
where onboarding_completed = false
  and id in (select distinct user_id from businesses);

commit;
