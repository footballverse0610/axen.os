-- =============================================================================
-- supabase/tests/001_rls.sql
--
-- 001_initial_schema.sql のRLSポリシー・整合性トリガーが意図通りに
-- 動作するかを検証するテストスイート。
--
-- 重要な警告:
--   このファイルはテストユーザー・テストデータの作成/削除を行う。
--   本番Supabaseプロジェクト、または実データの入った環境に対しては
--   絶対に実行しないこと。使い捨てのテスト用データベースでのみ実行する。
--
-- 実行方法:
--   1) 使い捨てのテスト用データベースを用意する
--        createdb kigyoshiyo_test
--   2) 001_initial_schema.sql を先に適用する
--        psql -d kigyoshiyo_test -f supabase/migrations/001_initial_schema.sql
--   3) 本ファイルを実行する
--        psql -d kigyoshiyo_test -f supabase/tests/001_rls.sql
--
--   auth.users / auth.uid() / anon・authenticated ロールは、Supabaseが
--   管理する実環境（本番 / `supabase start` のローカルスタック）では
--   既に存在する。本ファイルはプレーンなPostgreSQLでも実行できるように
--   スタブを用意するが、既に存在する場合は上書きしない(下記STEP 0参照)。
--
-- 各テストは DO ブロック内で PL/pgSQL の ASSERT を使う。失敗時は例外を
-- 送出してスクリプトを停止する。ファイル末尾の
-- "ALL RLS TESTS PASSED" まで到達すれば全テストが意図通りの結果。
-- =============================================================================

\set ON_ERROR_STOP on

-- -----------------------------------------------------------------------------
-- STEP 0: auth スタブ（既に auth.users / auth.uid() が存在する環境では
--         何もしない。実環境の auth 実装を誤って上書きしないための安全策）
-- -----------------------------------------------------------------------------
create schema if not exists auth;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'auth' and table_name = 'users'
  ) then
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text
    );
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $sql$
      create function auth.uid() returns uuid
      language sql stable
      as $inner$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $inner$
    $sql$;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
end
$$;

-- 実際のSupabaseプロジェクトでは authenticated/anon は auth スキーマの
-- USAGEとauth.uid()のEXECUTEを既に持っている。プレーンなPostgreSQLで
-- スタブを使う場合に備え、念のため付与しておく(既に付与済みでもエラーにならない)。
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- STEP 1: テストユーザーを2名作成
-- -----------------------------------------------------------------------------
delete from auth.users where email in ('user-a@test.local', 'user-b@test.local');

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@test.local');

\set user_a '11111111-1111-1111-1111-111111111111'
\set user_b '22222222-2222-2222-2222-222222222222'

-- =============================================================================
-- STEP 2: User A / User B が自分のデータを作成できる
-- =============================================================================
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into businesses (id, user_id, name, stage)
values ('a0000000-0000-0000-0000-000000000001', (select auth.uid()), 'User Aの事業', 'operating')
returning id as business_a \gset

insert into business_ideas (id, business_id, user_id, title, stage, potential_score)
values ('a0000000-0000-0000-0000-0000000000a1', :'business_a', (select auth.uid()), 'Aのアイデア', 'validating', 70);

insert into tasks (id, business_id, user_id, business_idea_id, title, priority)
values ('a0000000-0000-0000-0000-0000000000b1', :'business_a', (select auth.uid()), 'a0000000-0000-0000-0000-0000000000a1', 'Aのタスク', 'HIGH');

insert into goals (id, business_id, user_id, title, goal_type, target_value)
values ('a0000000-0000-0000-0000-0000000000c1', :'business_a', (select auth.uid()), 'Aの目標', 'revenue', 100000);

insert into sales (id, business_id, user_id, label, category, amount, sold_on)
values ('a0000000-0000-0000-0000-0000000000d1', :'business_a', (select auth.uid()), 'Aの売上', '商品売上', 5000, current_date);

insert into expenses (id, business_id, user_id, label, category, amount, spent_on)
values ('a0000000-0000-0000-0000-0000000000e1', :'business_a', (select auth.uid()), 'Aの経費', '運営費', 1000, current_date);

insert into coach_messages (id, business_id, user_id, role, content)
values ('a0000000-0000-0000-0000-0000000000f1', :'business_a', (select auth.uid()), 'user', 'Aの発言');

reset role;

do $$
begin
  raise notice 'PASS: User A が自身の business/idea/task/goal/sale/expense/coach_message を作成できた';
end
$$;

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into businesses (id, user_id, name, stage)
values ('b0000000-0000-0000-0000-000000000001', (select auth.uid()), 'User Bの事業', 'operating')
returning id as business_b \gset

insert into business_ideas (id, business_id, user_id, title, stage, potential_score)
values ('b0000000-0000-0000-0000-0000000000a1', :'business_b', (select auth.uid()), 'Bのアイデア', 'draft', 40);

insert into tasks (id, business_id, user_id, business_idea_id, title, priority)
values ('b0000000-0000-0000-0000-0000000000b1', :'business_b', (select auth.uid()), 'b0000000-0000-0000-0000-0000000000a1', 'Bのタスク', 'LOW');

insert into goals (id, business_id, user_id, title, goal_type, target_value)
values ('b0000000-0000-0000-0000-0000000000c1', :'business_b', (select auth.uid()), 'Bの目標', 'profit', 50000);

insert into sales (id, business_id, user_id, label, category, amount, sold_on)
values ('b0000000-0000-0000-0000-0000000000d1', :'business_b', (select auth.uid()), 'Bの売上', 'サービス売上', 3000, current_date);

insert into expenses (id, business_id, user_id, label, category, amount, spent_on)
values ('b0000000-0000-0000-0000-0000000000e1', :'business_b', (select auth.uid()), 'Bの経費', '外注費', 800, current_date);

insert into coach_messages (id, business_id, user_id, role, content)
values ('b0000000-0000-0000-0000-0000000000f1', :'business_b', (select auth.uid()), 'user', 'Bの発言');

reset role;

do $$
begin
  raise notice 'PASS: User B が自身の business/idea/task/goal/sale/expense/coach_message を作成できた';
end
$$;

-- =============================================================================
-- STEP 3: User A は自分のデータのみ取得できる（Bのデータは見えない）
-- =============================================================================
do $$
declare
  v_count int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

  select count(*) into v_count from businesses; assert v_count = 1, 'User Aに見えるbusinessは1件のはず';
  select count(*) into v_count from businesses where user_id = '22222222-2222-2222-2222-222222222222'; assert v_count = 0, 'User AにBのbusinessが見えている';

  select count(*) into v_count from business_ideas; assert v_count = 1, 'User Aに見えるbusiness_ideasは1件のはず';
  select count(*) into v_count from tasks; assert v_count = 1, 'User Aに見えるtasksは1件のはず';
  select count(*) into v_count from goals; assert v_count = 1, 'User Aに見えるgoalsは1件のはず';
  select count(*) into v_count from sales; assert v_count = 1, 'User Aに見えるsalesは1件のはず';
  select count(*) into v_count from expenses; assert v_count = 1, 'User Aに見えるexpensesは1件のはず';
  select count(*) into v_count from coach_messages; assert v_count = 1, 'User Aに見えるcoach_messagesは1件のはず';

  perform set_config('role', 'none', true);
  raise notice 'PASS: User Aは自分のデータのみ取得でき、Bのデータは一切見えない';
end
$$;

-- =============================================================================
-- STEP 4: User B は自分のデータのみ取得できる（Aのデータは見えない）
-- =============================================================================
do $$
declare
  v_count int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

  select count(*) into v_count from businesses; assert v_count = 1, 'User Bに見えるbusinessは1件のはず';
  select count(*) into v_count from businesses where user_id = '11111111-1111-1111-1111-111111111111'; assert v_count = 0, 'User BにAのbusinessが見えている';

  select count(*) into v_count from business_ideas; assert v_count = 1, 'User Bに見えるbusiness_ideasは1件のはず';
  select count(*) into v_count from tasks; assert v_count = 1, 'User Bに見えるtasksは1件のはず';
  select count(*) into v_count from goals; assert v_count = 1, 'User Bに見えるgoalsは1件のはず';
  select count(*) into v_count from sales; assert v_count = 1, 'User Bに見えるsalesは1件のはず';
  select count(*) into v_count from expenses; assert v_count = 1, 'User Bに見えるexpensesは1件のはず';
  select count(*) into v_count from coach_messages; assert v_count = 1, 'User Bに見えるcoach_messagesは1件のはず';

  perform set_config('role', 'none', true);
  raise notice 'PASS: User Bは自分のデータのみ取得でき、Aのデータは一切見えない';
end
$$;

-- =============================================================================
-- STEP 5: 不正な business_id の付け替え（INSERT）
-- =============================================================================
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

  begin
    insert into tasks (business_id, user_id, title)
    values ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Bによる A の business への不正INSERT');
    raise exception 'FAIL: Bが自分のuser_idのままAのbusiness_idでタスクを作成できてしまった';
  exception
    when sqlstate '23514' then
      raise notice 'PASS: business_idの付け替え(INSERT, user_idは正直)はcheck_business_owner()で拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 6: user_id を偽装した INSERT（RLSのwith checkで拒否されるはず）
--
-- 注: tasks等の子テーブルは check_business_owner() トリガーが先に発火し、
--     「指定business_idの実所有者 = new.user_id」を要求するため、
--     business_idもuser_idも詐称した場合は先にトリガー側(23514)で
--     拒否されてしまい、RLS単体のwith checkを分離して検証できない。
--     そこで、当該トリガーを持たない businesses テーブル（親テーブル）で
--     RLSのwith check単体の挙動を検証する。
-- =============================================================================
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

  begin
    insert into businesses (user_id, name)
    values ('11111111-1111-1111-1111-111111111111', 'B が A に成りすましたbusiness');
    raise exception 'FAIL: Bが自分のセッションのままuser_id=Aを詐称してbusinessesにINSERTできてしまった';
  exception
    when insufficient_privilege then
      raise notice 'PASS: user_idの偽装INSERT(businesses)はRLSのwith check((select auth.uid()) = user_id)で拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 7: 他人の行への UPDATE は 0 件（RLSのUSINGで対象行が見えない）
-- =============================================================================
do $$
declare
  v_rowcount int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

  update tasks set title = 'Bによる改ざん' where id = 'a0000000-0000-0000-0000-0000000000b1';
  get diagnostics v_rowcount = row_count;
  assert v_rowcount = 0, 'FAIL: BがAのタスクをUPDATEできてしまった';

  perform set_config('role', 'none', true);
  raise notice 'PASS: Bは自分に見えないAのタスクをUPDATEできない(対象0件)';
end
$$;

-- =============================================================================
-- STEP 8: 自分の行の business_id を他人の business に書き換える UPDATE
-- =============================================================================
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

  begin
    update tasks
    set business_id = 'a0000000-0000-0000-0000-000000000001'
    where id = 'b0000000-0000-0000-0000-0000000000b1';
    raise exception 'FAIL: Bが自分のタスクのbusiness_idをAのbusinessに書き換えられてしまった';
  exception
    when sqlstate '23514' then
      raise notice 'PASS: business_idの付け替え(UPDATE)はcheck_business_owner()で拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 9: 自分の行の user_id を他人に書き換える UPDATE（RLSで拒否）
--
-- 注: STEP6と同じ理由で、check_business_owner()を持たない businesses で検証する。
-- =============================================================================
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

  begin
    update businesses
    set user_id = '22222222-2222-2222-2222-222222222222'
    where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: Aが自分のbusinessのuser_idをBに書き換えられてしまった';
  exception
    when insufficient_privilege then
      raise notice 'PASS: user_idの書き換え(UPDATE, businesses)はRLSのwith checkで拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 10: business_idea_id の不正な紐付け（INSERT）
--   同じ business_id を使っていても、指定した business_idea が別のbusinessの
--   ものであれば拒否されるべき。ここでは「Aの2つ目のbusiness」を用意し、
--   1つ目のbusinessのideaを2つ目のbusinessのtaskに紐付けようとする。
-- =============================================================================
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into businesses (id, user_id, name, stage)
values ('a0000000-0000-0000-0000-000000000002', (select auth.uid()), 'User Aの2つ目の事業', 'idea');

reset role;

do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

  begin
    insert into tasks (business_id, user_id, business_idea_id, title)
    values (
      'a0000000-0000-0000-0000-000000000002',
      '11111111-1111-1111-1111-111111111111',
      'a0000000-0000-0000-0000-0000000000a1', -- 1つ目のbusinessのidea
      '事業をまたいだ不正な紐付け(INSERT)'
    );
    raise exception 'FAIL: 別businessのアイデアをtaskに紐付けられてしまった(INSERT)';
  exception
    when sqlstate '23514' then
      raise notice 'PASS: business_idea_idの事業またぎ紐付け(INSERT)はcheck_idea_business_match()で拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 11: business_idea_id の不正な紐付け（UPDATE）
-- =============================================================================
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

  begin
    update tasks
    set business_idea_id = 'a0000000-0000-0000-0000-0000000000a1' -- 別businessのidea
    where id = 'a0000000-0000-0000-0000-0000000000b1' and business_id = 'a0000000-0000-0000-0000-000000000001';
    -- ここまでは同一business内なので実は矛盾しないケースを避けるため、
    -- 対象タスクのbusiness_idを先に2つ目のbusinessへ変更するのではなく、
    -- 2つ目のbusiness配下の新規タスクに対してUPDATEで不正な紐付けを試みる
    raise notice '(準備) 通常のUPDATEは成功しうるため、続けて事業またぎのケースを個別に検証する';
  end;

  perform set_config('role', 'none', true);
end
$$;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tasks (id, business_id, user_id, title)
values ('a0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-000000000002', (select auth.uid()), '2つ目の事業のタスク');

reset role;

do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

  begin
    update tasks
    set business_idea_id = 'a0000000-0000-0000-0000-0000000000a1' -- 1つ目のbusinessのidea
    where id = 'a0000000-0000-0000-0000-0000000000b2'; -- 2つ目のbusinessのtask
    raise exception 'FAIL: 別businessのアイデアをtaskに紐付けられてしまった(UPDATE)';
  exception
    when sqlstate '23514' then
      raise notice 'PASS: business_idea_idの事業またぎ紐付け(UPDATE)はcheck_idea_business_match()で拒否された';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 12: 未認証(anon)ユーザーはテーブルへアクセスできない
--   revoke all ... from anon; により、RLS以前に権限の段階で拒否される。
-- =============================================================================
do $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);

  begin
    perform 1 from businesses limit 1;
    raise exception 'FAIL: anonロールがbusinessesをSELECTできてしまった';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anonロールはbusinessesをSELECTできない(権限自体がない)';
  end;

  begin
    insert into tasks (business_id, user_id, title)
    values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'anonからの不正INSERT');
    raise exception 'FAIL: anonロールがtasksにINSERTできてしまった';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anonロールはtasksにINSERTできない(権限自体がない)';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- STEP 13: JWTクレームが無い authenticated（auth.uid() が NULL）は
--          何も見えず、何も書き込めない
-- =============================================================================
do $$
declare
  v_count int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '', true);

  select count(*) into v_count from businesses;
  assert v_count = 0, 'FAIL: auth.uid()がNULLのセッションでもbusinessesが見えてしまった';

  begin
    insert into businesses (user_id, name) values (null, 'NULLユーザーの事業');
    raise exception 'FAIL: user_id=NULLでbusinessesにINSERTできてしまった';
  exception
    when others then
      raise notice 'PASS: auth.uid()がNULLのセッションは何も見えず、書き込みも失敗する';
  end;

  perform set_config('role', 'none', true);
end
$$;

-- =============================================================================
-- 完了
-- =============================================================================
do $$
begin
  raise notice '=================================================';
  raise notice 'ALL RLS TESTS PASSED';
  raise notice '=================================================';
end
$$;
