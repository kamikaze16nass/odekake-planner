-- ============================================================
-- お出かけ意思決定支援アプリ
-- 003_add_schedule_transport_policy.sql
-- ============================================================
-- 前提:
--   001_create_database.sql
--   002_setup_rls_and_functions.sql
--
-- 予定単位の交通方針を追加します。
-- 既存行は default の flexible として安全に補完されます。
-- ============================================================

begin;

alter table public.schedules
  add column if not exists transport_policy text
  not null
  default 'flexible';

alter table public.schedules
  drop constraint if exists schedules_transport_policy_check;

alter table public.schedules
  add constraint schedules_transport_policy_check
  check (transport_policy in ('transit', 'flexible'));

commit;
