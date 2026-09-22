-- =============================================================================
-- 起業しよ。: オンボーディングを「起業・事業づくり支援」専用に再設計
--
-- 002_onboarding_profile.sql で追加した人生改善アプリ向けの質問
-- (main_goals/current_state/three_month_goal/coach_preferences)を廃止し、
-- 事業支援に直結する項目(現在の課題/週あたりの稼働時間/初期予算/
-- アイデア未定フラグ)へ置き換える。
--
-- businesses.name は本migrationでは変更しない(引き続きnot null)。
-- 事業名が未入力の場合はアプリ側(createBusiness/saveOnboardingProfile)で
-- 「事業N」のような仮の名前を自動的に割り当てるため、DB側の制約を
-- 緩める必要はない(既存のDeleteBusinessModal等、事業名の存在を
-- 前提とする画面への影響を避けるため)。
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. 不要になった列の削除(人生改善アプリ向けの質問)
-- -----------------------------------------------------------------------------
alter table profiles
  drop column main_goals,
  drop column current_state,
  drop column three_month_goal,
  drop column coach_preferences;

drop type if exists onboarding_current_state;

-- -----------------------------------------------------------------------------
-- 2. available_time(1日あたり・分単位)を weekly_available_time(週あたり・時間単位)へ
-- -----------------------------------------------------------------------------
-- 「起業に使える時間」は日次の分単位より週次の時間単位の方が事業計画の
-- 実態に合うため、列・ENUMを新設して置き換える。習慣アプリ向けの
-- 旧スケール(分/日)と新スケール(時間/週)は単純な数値変換ができないため、
-- 既存値はそのまま引き継がず、次回のプロフィール編集で入り直す想定とする
-- (onboarding_completedは変更しないため、既存ユーザーに再度オンボーディング
-- 全体をやり直させることはない)。
alter table profiles
  drop column available_time;

drop type if exists onboarding_available_time;

create type onboarding_weekly_time as enum (
  'under_5h',  -- 週5時間未満
  '5_15h',     -- 週5〜15時間
  '15_30h',    -- 週15〜30時間
  'over_30h'   -- 週30時間以上
);

alter table profiles
  add column weekly_available_time onboarding_weekly_time;

-- -----------------------------------------------------------------------------
-- 3. 事業支援に直結する新しい列
-- -----------------------------------------------------------------------------
alter table profiles
  add column current_challenges text[] not null default '{}',
  add column initial_budget_range text,
  add column needs_idea_help boolean not null default false;

comment on column profiles.current_challenges is
  'オンボーディングQ3「今、一番の課題は？」で選択した項目(複数選択)';
comment on column profiles.weekly_available_time is
  'オンボーディングQ5「起業に使える時間は？」で選択した項目(週あたり、単一選択)';
comment on column profiles.initial_budget_range is
  'オンボーディングQ6「初期予算は？」で選択した項目(任意、単一選択)';
comment on column profiles.needs_idea_help is
  'オンボーディングQ1で「まだアイデアがない」を選んだユーザーはtrue。AI Coachの初回応答の分岐に使う。';

commit;
