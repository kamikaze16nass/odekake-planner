-- ============================================================
-- お出かけ意思決定支援アプリ
-- RLS V2.1 適用SQL
-- ============================================================
-- 【目的】
-- Supabase上のRLS・RPC・Function権限を、
-- 現在確認済みのRLS V2.1設計へそろえるためのSQLです。
--
-- 【V2.1で確認済みの仕様】
-- ・Anonymous Sign-Inを利用したユーザーは、
--   サインイン後は authenticated ロールとして扱います。
-- ・schedules は、
--   「その予定の参加者」または「その予定の作成者本人」のみ参照できます。
-- ・responses は、その予定の参加者のみ参照できます。
-- ・responses の追加・更新は、
--   ログイン中ユーザー本人の回答だけに制限し、
--   かつ対象予定の参加者であることを確認します。
-- ・members の参照は、現在の参加・取得フローとの互換性を優先し、
--   V2.1では authenticated に対して許可したままにします。
-- ・DELETE用のPolicyは、V2.1ではまだ設定しません。
--
-- 【実行方法】
-- 1. Supabase Dashboard の SQL Editor でこのファイルを実行します。
-- 2. SQL本体の実行後、ファイル末尾の確認用SQLも実行します。
-- 3. RLS、Policy、Function定義、実行権限が想定どおりか確認します。
--
-- 【重要】
-- members SELECT のさらなる制限は、今後のセキュリティ強化候補です。
-- 現時点では、参加・データ取得フローの回帰テストを完了していないため、
-- このSQLではまだ適用しません。
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. RLSを有効化
-- ------------------------------------------------------------

alter table public.schedules enable row level security;
alter table public.members enable row level security;
alter table public.responses enable row level security;


-- ------------------------------------------------------------
-- 2. 参加者判定Function：is_schedule_member
-- ------------------------------------------------------------
-- members自身のSELECT Policyに依存してRLSが再帰することを避けるため、
-- SECURITY DEFINERを使用して予定への参加有無を判定します。

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
-- 3. 招待コード検索RPC：find_schedule_by_invite_code
-- ------------------------------------------------------------
-- まだ予定へ参加していないユーザーが、
-- 招待コードから対象予定を特定するための専用RPCです。
--
-- 返却するのは参加フローに必要な予定情報だけに限定します。
-- auth.uid() が存在しない未認証状態では結果を返しません。

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
-- 4. Functionの実行権限
-- ------------------------------------------------------------
-- PostgreSQLではFunctionにPUBLICの実行権限が付く場合があるため、
-- まずPUBLICおよびanonの実行権限を明示的に外します。
--
-- そのうえで、アプリから利用する authenticated と、
-- Supabase管理用の service_role にだけ実行権限を付与します。
-- postgres はFunction所有者・管理ロールとして扱います。

revoke all on function public.is_schedule_member(uuid) from public;
revoke execute on function public.is_schedule_member(uuid) from anon;
grant execute on function public.is_schedule_member(uuid)
  to authenticated, service_role;

revoke all on function public.find_schedule_by_invite_code(text) from public;
revoke execute on function public.find_schedule_by_invite_code(text) from anon;
grant execute on function public.find_schedule_by_invite_code(text)
  to authenticated, service_role;


-- ------------------------------------------------------------
-- 5. schedules のPolicy
-- ------------------------------------------------------------

drop policy if exists "allow authenticated insert own schedule"
  on public.schedules;

-- V2の旧Policy名とV2.1のPolicy名を両方削除してから作り直します。
-- これにより、どちらの状態から実行してもPolicyが重複しにくくなります。

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

-- V2.1での修正点。
-- 予定作成直後は、作成者本人のmembers登録がまだ完了していません。
-- そのため作成者本人については、memberになる前でも
-- INSERT直後の予定を参照できるようにします。
--
-- これにより、予定作成 → 予定ID取得 → members登録
-- という現在の作成フローが正常に動作します。

create policy "allow members or creator read schedules"
on public.schedules
for select
to authenticated
using (
  created_by = auth.uid()::text
  or public.is_schedule_member(id)
);


-- ------------------------------------------------------------
-- 6. members のPolicy
-- ------------------------------------------------------------
-- V2.1では、現在の参加・データ取得フローとの互換性を優先して、
-- authenticatedユーザーによるSELECTを許可します。
-- INSERT / UPDATE は本人のuser_idだけに制限します。
--
-- 【今後のセキュリティ強化候補】
-- members SELECT を
-- public.is_schedule_member(schedule_id)
-- による同一予定参加者限定へ変更することを検討します。
-- 変更時は、招待参加・予定作成・データ再取得の回帰テストを行います。

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
-- 7. responses のPolicy
-- ------------------------------------------------------------

drop policy if exists "allow authenticated insert own response"
  on public.responses;

drop policy if exists "allow authenticated update own response"
  on public.responses;

drop policy if exists "allow schedule members read responses"
  on public.responses;

-- 回答追加は、
-- ・user_idがログイン中の本人である
-- ・対象予定のmemberである
-- の両方を満たす場合だけ許可します。

create policy "allow authenticated insert own response"
on public.responses
for insert
to authenticated
with check (
  user_id = auth.uid()::text
  and public.is_schedule_member(schedule_id)
);

-- 回答更新も本人の回答だけに限定し、
-- 更新前・更新後の両方で予定参加者であることを確認します。

create policy "allow authenticated update own response"
on public.responses
for update
to authenticated
using (
  user_id = auth.uid()::text
  and public.is_schedule_member(schedule_id)
)
with check (
  user_id = auth.uid()::text
  and public.is_schedule_member(schedule_id)
);

-- 回答一覧は、対象予定の参加者だけが参照できます。

create policy "allow schedule members read responses"
on public.responses
for select
to authenticated
using (
  public.is_schedule_member(schedule_id)
);


-- ------------------------------------------------------------
-- 8. DELETE PolicyはV2.1では設定しない
-- ------------------------------------------------------------
-- 予定削除・予定からの退出・回答削除の仕様が確定するまでは、
-- RLSによってDELETEを許可しない状態を維持します。

commit;


-- ============================================================
-- 実行後の確認用SQL
-- ============================================================

-- ------------------------------------------------------------
-- A. 3テーブルでRLSが有効になっているか確認
-- ------------------------------------------------------------

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('schedules', 'members', 'responses')
order by tablename;


-- ------------------------------------------------------------
-- B. 現在設定されているPolicyを確認
-- ------------------------------------------------------------

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('schedules', 'members', 'responses')
order by tablename, policyname;


-- ------------------------------------------------------------
-- C. Functionの定義内容を確認
-- ------------------------------------------------------------

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


-- ------------------------------------------------------------
-- D. Functionに設定されている実行権限を確認
-- ------------------------------------------------------------

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
order by routine_name, grantee, privilege_type;


-- ------------------------------------------------------------
-- E. anon / authenticated のFunction実行可否を直接確認
-- ------------------------------------------------------------
-- 想定結果：
-- anon          → false / false
-- authenticated → true  / true

select
  'anon' as role_name,
  has_function_privilege(
    'anon',
    'public.is_schedule_member(uuid)',
    'EXECUTE'
  ) as can_execute_is_schedule_member,
  has_function_privilege(
    'anon',
    'public.find_schedule_by_invite_code(text)',
    'EXECUTE'
  ) as can_execute_invite_lookup

union all

select
  'authenticated' as role_name,
  has_function_privilege(
    'authenticated',
    'public.is_schedule_member(uuid)',
    'EXECUTE'
  ) as can_execute_is_schedule_member,
  has_function_privilege(
    'authenticated',
    'public.find_schedule_by_invite_code(text)',
    'EXECUTE'
  ) as can_execute_invite_lookup;
