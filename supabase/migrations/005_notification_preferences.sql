-- =============================================================================
-- 起業しよ。: タスク/目標リマインダー通知の設定を保存する列を追加
--
-- Android版のローカル通知(端末内スケジュール、サーバー送信ではない)の
-- ON/OFFと通知時刻をユーザーごとに保存する。
-- 新規列はどちらもNOT NULL + 定数DEFAULTのため、既存行もそのまま
-- デフォルト値(通知OFF・09:00)で埋まり、エラーは発生しない。
-- =============================================================================

begin;

alter table profiles
  add column notifications_enabled boolean not null default false,
  add column notification_time time not null default '09:00:00';

comment on column profiles.notifications_enabled is
  'タスク/目標期限のローカル通知(Android)を有効にしているか';
comment on column profiles.notification_time is
  '通知を送る時刻(ユーザーの端末ローカル時刻、時分のみ使用)';

commit;
