-- =============================================================================
-- Axen OS: tasks.category を固定ENUM(task_category)から自由入力(text)へ変更
--
-- 目的: タスク作成・編集時にカテゴリーを「自由入力+候補選択」方式にするため。
-- 既存の6種類の値('商品','マーケティング','営業','資金調達','運営','その他')は
-- そのままtextとして引き継がれ、既存データは一切失われない。
-- =============================================================================

begin;

alter table tasks
  alter column category type text using category::text,
  alter column category set default 'その他';

comment on column tasks.category is
  '自由入力のカテゴリー(以前はtask_category enumで固定6種のみだったが、text型に変更し
  自由入力+候補選択方式に対応した)。空欄の場合はアプリ側で''その他''を補う。';

drop type if exists task_category;

commit;
