-- ============================================================
-- お出かけ意思決定支援アプリ
-- 002_setup_rls_and_functions.sql
-- ============================================================
-- 目的:
--   現時点のRLS・Policy・RPC・Function権限を再現します。
--
-- 前提:
--   001_create_database.sql が実行済みであること。
--
-- 型について:
--   schedules.created_by : text
--   members.user_id      : text
--   responses.user_id    : uuid
--
-- そのため、
--   members.user_id      = auth.uid()::text
--   responses.user_id    = auth.uid()
-- と比較します。
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. RLSを有効化
-- ------------------------------------------------------------

alter table public.schedules enable row level security;
alter table public.members enable row level security;
alter table public.responses enable row level security;


-- ------------------------------------------------------------
-- 2. 参加者判定Function
-- ------------------------------------------------------------
-- schedulesのSELECT Policy等から利用します。
-- members自身のRLS再帰を避けるため SECURITY DEFINER を使用します。

create or replace function public.is_schedule_member(
  input_schedule_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.members
      where schedule_id = input_schedule_id
        and user_id = auth.uid()::text
    );
$function$;


-- ------------------------------------------------------------
-- 3. 招待コード検索RPC
-- ------------------------------------------------------------
-- まだmembersに登録されていない招待ユーザーでも、
-- 招待コードから対象予定を特定できるようにする専用RPCです。

create or replace function public.find_schedule_by_invite_code(
  input_invite_code text
)
returns table(
  id uuid,
  title text,
  start_date date,
  end_date date,
  memo text,
  status text,
  invite_code text
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    s.id,
    s.title,
    s.start_date,
    s.end_date,
    s.memo,
    s.status,
    s.invite_code
  from public.schedules s
  where auth.uid() is not null
    and upper(s.invite_code) = upper(trim(input_invite_code))
  limit 1;
$function$;


-- ------------------------------------------------------------
-- 4. Function実行権限
-- ------------------------------------------------------------

revoke all on function public.is_schedule_member(uuid) from public;
revoke execute on function public.is_schedule_member(uuid) from anon;
grant execute on function public.is_schedule_member(uuid)
  to authenticated, service_role;

revoke all on function public.find_schedule_by_invite_code(text) from public;
revoke execute on function public.find_schedule_by_invite_code(text) from anon;
grant execute on function public.find_schedule_by_invite_code(text)
  to authenticated, service_role;


-- ------------------------------------------------------------
-- 5. schedules Policy
-- ------------------------------------------------------------

drop policy if exists "allow authenticated insert own schedule"
  on public.schedules;

drop policy if exists "allow members read schedules"
  on public.schedules;

drop policy if exists "allow members or creator read schedules"
  on public.schedules;

create policy "allow authenticated insert own schedule"
on public.schedules
for insert
to authenticated
with check (
  created_by = auth.uid()::text
);

create policy "allow members or creator read schedules"
on public.schedules
for select
to authenticated
using (
  created_by = auth.uid()::text
  or public.is_schedule_member(id)
);


-- ------------------------------------------------------------
-- 6. members Policy
-- ------------------------------------------------------------
-- 現行仕様ではauthenticatedユーザーのmembers SELECTを許可。
-- 将来的に同一予定参加者だけへ絞る余地があります。

drop policy if exists "allow authenticated insert own member"
  on public.members;

drop policy if exists "allow authenticated read members"
  on public.members;

drop policy if exists "allow schedule members read members"
  on public.members;

drop policy if exists "allow authenticated update own member"
  on public.members;

create policy "allow authenticated insert own member"
on public.members
for insert
to authenticated
with check (
  user_id = auth.uid()::text
);

create policy "allow authenticated read members"
on public.members
for select
to authenticated
using (true);

create policy "allow authenticated update own member"
on public.members
for update
to authenticated
using (
  user_id = auth.uid()::text
)
with check (
  user_id = auth.uid()::text
);


-- ------------------------------------------------------------
-- 7. responses Policy
-- ------------------------------------------------------------
-- 古いPolicy名と現在のPolicy名を両方削除し、
-- 何度実行しても重複しにくい形にします。

drop policy if exists "allow authenticated insert own response"
  on public.responses;

drop policy if exists "allow authenticated update own response"
  on public.responses;

drop policy if exists "allow schedule members read responses"
  on public.responses;

drop policy if exists "members can read schedule responses"
  on public.responses;

drop policy if exists "users can insert own responses"
  on public.responses;

drop policy if exists "users can update own responses"
  on public.responses;

drop policy if exists "users can delete own responses"
  on public.responses;


-- 予定参加者だけ、その予定の回答を参照可能
create policy "members can read schedule responses"
on public.responses
for select
to authenticated
using (
  exists (
    select 1
    from public.members
    where members.schedule_id = responses.schedule_id
      and members.user_id = auth.uid()::text
  )
);


-- 自分自身の回答かつ、対象予定の参加者だけINSERT可能
create policy "users can insert own responses"
on public.responses
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.members
    where members.schedule_id = responses.schedule_id
      and members.user_id = auth.uid()::text
  )
);


-- 自分自身の回答だけUPDATE可能
create policy "users can update own responses"
on public.responses
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);


-- 自分自身の回答だけDELETE可能
create policy "users can delete own responses"
on public.responses
for delete
to authenticated
using (
  user_id = auth.uid()
);

commit;


-- ============================================================
-- 実行後の確認用SQL
-- ============================================================

-- A. RLS有効状態
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'schedules',
    'members',
    'responses'
  )
order by tablename;


-- B. Policy一覧
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'schedules',
    'members',
    'responses'
  )
order by tablename, policyname;


-- C. Function定義
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_schedule_member',
    'find_schedule_by_invite_code'
  )
order by p.proname;


-- D. Function権限
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'is_schedule_member',
    'find_schedule_by_invite_code'
  )
order by
  routine_name,
  grantee,
  privilege_type;
