-- =============================================================================
-- 起業しよ。 initial schema
--
-- DATABASE_DESIGN.md を反映した初期マイグレーション。
-- 作成するテーブル: profiles, businesses, business_ideas, tasks, goals,
--                   sales, expenses, coach_messages
--
-- 前提: Supabaseプロジェクト上で実行する（auth.users は Supabase Auth が管理する
--       既存テーブルであり、本マイグレーションでは作成しない）。
--
-- セキュリティ方針:
--   - 全テーブルでRLSを有効化し、"to authenticated" を明示した上で
--     auth.uid() は (select auth.uid()) の形式で呼び出す
--     (Supabase推奨: 1クエリにつき1回だけ評価されるようにするための書き方)
--   - anon / PUBLIC への既定の権限付与に依存せず、明示的にREVOKEした上で
--     authenticatedにのみ必要な権限をGRANTする(多層防御)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. 拡張機能
-- -----------------------------------------------------------------------------
-- Supabase (PostgreSQL 15+) では gen_random_uuid() はコア機能として利用できるが、
-- 念のため pgcrypto を明示的に有効化しておく。
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. ENUM型
-- -----------------------------------------------------------------------------
create type business_stage as enum ('idea', 'preparing', 'operating', 'paused');
create type idea_stage as enum ('draft', 'validating', 'building', 'launched');
create type task_priority as enum ('HIGH', 'MEDIUM', 'LOW');
create type task_category as enum ('商品', 'マーケティング', '営業', '資金調達', '運営', 'その他');
create type goal_type as enum ('revenue', 'profit', 'sales_count', 'custom');
create type goal_status as enum ('active', 'achieved', 'missed', 'paused');
create type coach_role as enum ('user', 'coach');

-- -----------------------------------------------------------------------------
-- 2. 共通トリガー関数
-- -----------------------------------------------------------------------------
-- いずれも SECURITY INVOKER（呼び出したユーザーの権限で実行）。
-- businesses / business_ideas への参照はRLSの制約を受けたまま行われるため、
-- 「存在しない」と「存在するが自分のものではない」は区別できない
-- (=他ユーザーのデータの存在自体が漏れない)設計になっている。

-- updated_at を更新時刻に自動更新する
create or replace function set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- business_id が「その行の user_id が所有する business」であることを保証する。
-- (user_id は RLSを単純化するための冗長列。business_id の付け替えで
--  他人の business に紐付けようとする不正な書き込みを防ぐ)
create or replace function check_business_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from businesses
    where id = new.business_id
      and user_id = new.user_id
  ) then
    raise exception 'business_id % does not belong to user_id %', new.business_id, new.user_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- business_idea_id が設定されている場合、そのアイデアが同じ business に
-- 属していることを保証する（他の事業のアイデアを紐付けられないようにする）。
create or replace function check_idea_business_match()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.business_idea_id is not null and not exists (
    select 1 from business_ideas
    where id = new.business_idea_id
      and business_id = new.business_id
  ) then
    raise exception 'business_idea_id % does not belong to business_id %', new.business_idea_id, new.business_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- トリガー関数は BEFORE トリガー経由でのみ意味を持つため、
-- ユーザーからの直接呼び出しに使う EXECUTE 権限は不要。PUBLICから剥奪する。
-- (トリガーの発火自体はテーブルへのINSERT/UPDATE権限で制御されるため、
--  これを剥奪してもトリガーは正常に動作する)
revoke execute on function set_updated_at() from public;
revoke execute on function check_business_owner() from public;
revoke execute on function check_idea_business_match() from public;

-- =============================================================================
-- 3. profiles（個人プロフィール）
-- =============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'ユーザー個人のプロフィール。事業情報は businesses に分離している。';

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

-- =============================================================================
-- 4. businesses（ビジネス）
-- =============================================================================
create table businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  one_liner text,
  industry text,
  stage business_stage not null default 'idea',
  founded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_user_name_unique unique (user_id, name)
);

comment on table businesses is 'ユーザーが運営する事業。以降の全事業データの親となる。';

create index idx_businesses_user_id on businesses(user_id);

create trigger trg_businesses_updated_at
  before update on businesses
  for each row execute function set_updated_at();

alter table businesses enable row level security;

create policy "businesses_select_own" on businesses
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "businesses_insert_own" on businesses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "businesses_update_own" on businesses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "businesses_delete_own" on businesses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 5. business_ideas（ビジネスアイデア）
-- =============================================================================
create table business_ideas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  stage idea_stage not null default 'draft',
  potential_score smallint not null default 0
    constraint business_ideas_potential_score_range check (potential_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table business_ideas is 'businessに紐づくビジネスアイデア。';

create index idx_business_ideas_business_id on business_ideas(business_id);
create index idx_business_ideas_business_stage on business_ideas(business_id, stage);

create trigger trg_business_ideas_updated_at
  before update on business_ideas
  for each row execute function set_updated_at();

create trigger trg_business_ideas_owner_check
  before insert or update on business_ideas
  for each row execute function check_business_owner();

alter table business_ideas enable row level security;

create policy "business_ideas_select_own" on business_ideas
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "business_ideas_insert_own" on business_ideas
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "business_ideas_update_own" on business_ideas
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "business_ideas_delete_own" on business_ideas
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 6. tasks（タスク）
-- =============================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_idea_id uuid references business_ideas(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority task_priority not null default 'MEDIUM',
  category task_category not null default 'その他',
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table tasks is 'businessに紐づくタスク。business_idea_idで特定のアイデアに任意で関連付け可能。';

create index idx_tasks_business_id on tasks(business_id);
create index idx_tasks_business_done on tasks(business_id, done);
create index idx_tasks_business_due_date on tasks(business_id, due_date);
create index idx_tasks_business_idea_id on tasks(business_idea_id);

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create trigger trg_tasks_owner_check
  before insert or update on tasks
  for each row execute function check_business_owner();

create trigger trg_tasks_idea_match
  before insert or update on tasks
  for each row execute function check_idea_business_match();

alter table tasks enable row level security;

create policy "tasks_select_own" on tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "tasks_insert_own" on tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "tasks_update_own" on tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "tasks_delete_own" on tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 7. goals（目標）
-- =============================================================================
create table goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  goal_type goal_type not null,
  target_value numeric(12, 2) not null
    constraint goals_target_value_positive check (target_value > 0),
  current_value numeric(12, 2) not null default 0
    constraint goals_current_value_non_negative check (current_value >= 0),
  unit text,
  start_date date not null default current_date,
  target_date date,
  status goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_target_date_after_start check (target_date is null or target_date >= start_date)
);

comment on table goals is 'businessの目標。goal_typeにより進捗の算出方法が異なる(DATABASE_DESIGN.md 4.3参照)。';

create index idx_goals_business_id on goals(business_id);
create index idx_goals_business_status on goals(business_id, status);

create trigger trg_goals_updated_at
  before update on goals
  for each row execute function set_updated_at();

create trigger trg_goals_owner_check
  before insert or update on goals
  for each row execute function check_business_owner();

alter table goals enable row level security;

create policy "goals_select_own" on goals
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "goals_insert_own" on goals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "goals_update_own" on goals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "goals_delete_own" on goals
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 8. sales（売上）
-- =============================================================================
create table sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_idea_id uuid references business_ideas(id) on delete set null,
  label text not null,
  category text not null,
  customer_name text,
  quantity integer not null default 1
    constraint sales_quantity_positive check (quantity > 0),
  amount numeric(12, 2) not null
    constraint sales_amount_positive check (amount > 0),
  sold_on date not null,
  created_at timestamptz not null default now()
);

comment on table sales is 'businessに紐づく売上明細。';

create index idx_sales_business_sold_on on sales(business_id, sold_on);
create index idx_sales_business_idea_id on sales(business_idea_id);

create trigger trg_sales_owner_check
  before insert or update on sales
  for each row execute function check_business_owner();

create trigger trg_sales_idea_match
  before insert or update on sales
  for each row execute function check_idea_business_match();

alter table sales enable row level security;

create policy "sales_select_own" on sales
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "sales_insert_own" on sales
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "sales_update_own" on sales
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "sales_delete_own" on sales
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 9. expenses（経費）
-- =============================================================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_idea_id uuid references business_ideas(id) on delete set null,
  label text not null,
  category text not null,
  vendor text,
  amount numeric(12, 2) not null
    constraint expenses_amount_positive check (amount > 0),
  is_tax_deductible boolean not null default true,
  spent_on date not null,
  created_at timestamptz not null default now()
);

comment on table expenses is 'businessに紐づく経費明細。';

create index idx_expenses_business_spent_on on expenses(business_id, spent_on);
create index idx_expenses_business_idea_id on expenses(business_idea_id);

create trigger trg_expenses_owner_check
  before insert or update on expenses
  for each row execute function check_business_owner();

create trigger trg_expenses_idea_match
  before insert or update on expenses
  for each row execute function check_idea_business_match();

alter table expenses enable row level security;

create policy "expenses_select_own" on expenses
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "expenses_insert_own" on expenses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "expenses_update_own" on expenses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "expenses_delete_own" on expenses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 10. coach_messages（AI Coach 会話履歴）
-- =============================================================================
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role coach_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

comment on table coach_messages is 'businessごとのAI Coachとの会話ログ。';

create index idx_coach_messages_business_created_at on coach_messages(business_id, created_at);

create trigger trg_coach_messages_owner_check
  before insert or update on coach_messages
  for each row execute function check_business_owner();

alter table coach_messages enable row level security;

create policy "coach_messages_select_own" on coach_messages
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "coach_messages_insert_own" on coach_messages
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "coach_messages_update_own" on coach_messages
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "coach_messages_delete_own" on coach_messages
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- 11. 権限の明示的な締め直し（多層防御）
-- =============================================================================
-- SupabaseプロジェクトはデフォルトでPUBLICスキーマの新規テーブルに対して
-- anon / authenticated ロールへ自動的に権限を付与する設定になっていることが多い。
-- RLSが唯一の防衛線にならないよう、ここで明示的に
--   1) PUBLIC と anon から全権限を剥奪
--   2) authenticated にのみ必要な権限を付与
-- を行う。万一RLSポリシーの設定に将来ミスがあっても、anon(未認証)は
-- そもそもテーブルへアクセスする権限自体を持たない状態にする。
revoke all on
  profiles, businesses, business_ideas, tasks, goals, sales, expenses, coach_messages
from public;

revoke all on
  profiles, businesses, business_ideas, tasks, goals, sales, expenses, coach_messages
from anon;

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  profiles, businesses, business_ideas, tasks, goals, sales, expenses, coach_messages
to authenticated;

commit;
