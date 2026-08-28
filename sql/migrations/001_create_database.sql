-- ============================================================
-- お出かけ意思決定支援アプリ
-- 001_create_database.sql
-- ============================================================
-- 目的:
--   現時点のDB構造を、新しいSupabase環境で再現するための
--   ベースラインMigrationです。
--
-- 対象:
--   public.schedules
--   public.members
--   public.responses
--
-- 注意:
--   RLS / Policy / RPC / Function権限は
--   002_setup_rls_and_functions.sql で設定します。
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. schedules
-- ------------------------------------------------------------

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),

  title text,
  start_date date,
  end_date date,
  memo text,

  status text default 'active'::text,

  invite_code text,
  created_by text,

  created_at timestamptz default now(),

  constraint schedules_date_range_check
    check (start_date <= end_date),

  constraint schedules_invite_code_key
    unique (invite_code)
);

-- ------------------------------------------------------------
-- 2. members
-- ------------------------------------------------------------

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),

  schedule_id uuid
    references public.schedules(id)
    on delete cascade,

  -- 現行DBでは text。
  -- Supabase Auth UIDとは auth.uid()::text で比較します。
  user_id text,

  name text,

  created_at timestamptz default now(),

  constraint members_schedule_user_unique
    unique (schedule_id, user_id)
);

-- ------------------------------------------------------------
-- 3. responses
-- ------------------------------------------------------------

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),

  schedule_id uuid
    references public.schedules(id)
    on delete cascade,

  -- 現行DBでは uuid。
  -- members.user_id(text)とは型が異なるため注意。
  user_id uuid,

  available_dates text[] default '{}'::text[],
  activities text[] default '{}'::text[],

  -- 徒歩 / 車の場合のみ利用
  departure text,
  departure_lat double precision,
  departure_lng double precision,

  -- walking / driving / transit / null
  -- null は「条件なし」
  transport_mode text,

  -- 徒歩 / 車の場合のみ利用
  travel_time integer,

  -- 行きたい場所・ジャンル。
  -- 重複を許可し、配列の1要素を1票として扱います。
  preferred_areas text[] default '{}'::text[],

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint responses_schedule_user_unique
    unique (schedule_id, user_id),

  constraint responses_preferred_areas_max_5
    check (
      cardinality(preferred_areas) <= 5
    ),

  constraint responses_transport_mode_check
    check (
      transport_mode in (
        'walking',
        'driving',
        'transit'
      )
      or transport_mode is null
    ),

  constraint responses_travel_time_positive
    check (
      travel_time is null
      or travel_time > 0
    ),

  constraint responses_transport_consistency
    check (
      (
        transport_mode in ('walking', 'driving')
        and departure is not null
        and departure_lat is not null
        and departure_lng is not null
        and travel_time is not null
      )
      or
      (
        transport_mode = 'transit'
        and departure is null
        and departure_lat is null
        and departure_lng is null
        and travel_time is null
        and cardinality(preferred_areas) >= 1
        and cardinality(preferred_areas) <= 5
      )
      or
      (
        transport_mode is null
        and departure is null
        and departure_lat is null
        and departure_lng is null
        and travel_time is null
      )
    )
);

commit;

-- ============================================================
-- 確認用
-- ============================================================

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('schedules', 'members', 'responses')
order by table_name, ordinal_position;

select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  pg_get_constraintdef(c.oid) as definition
from information_schema.table_constraints tc
join pg_constraint c
  on c.conname = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name in ('schedules', 'members', 'responses')
order by
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name;
