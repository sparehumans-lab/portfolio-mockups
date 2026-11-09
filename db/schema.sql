-- 자동 생성: tools/gen_schema.py  (Supabase SQL Editor 에서 한 번 실행)
-- 포트폴리오 데모용: 방문자(anon)에게 읽기/쓰기를 모두 허용합니다. 실제 서비스 데이터는 넣지 마세요.

create table if not exists public.a_instructors (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.a_classes (
  id text primary key,
  name text not null,
  level text,
  instructor_id text,
  price integer not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.a_bookings (
  id text primary key,
  class_id text not null,
  customer_name text not null,
  phone text,
  parking boolean default false,
  date text not null,
  slot text not null,
  amount integer not null check (amount >= 0),
  pay_method text,
  status text not null check (status in ('확정','대기','취소')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.a_messages (
  id text primary key,
  booking_id text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.a_rate_jobs (
  id text primary key,
  class_ids jsonb,
  mode text check (mode in ('pct','won')),
  value integer,
  results jsonb,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_users (
  id text primary key,
  name text not null,
  roles jsonb,
  area text,
  days text,
  career integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_companies (
  id text primary key,
  name text not null,
  owner_id text,
  area text,
  status text not null check (status in ('승인','대기','반려')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_quotes (
  id text primary key,
  type text not null,
  area text not null,
  size integer check (size > 0),
  date text,
  cap integer not null check (cap between 1 and 5),
  note text,
  requester_id text not null,
  status text not null,
  result text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_quote_joins (
  id text primary key,
  quote_id text not null,
  company_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_jobs (
  id text primary key,
  title text not null,
  area text,
  when_at text,
  pay text,
  need integer check (need > 0),
  company_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.c_applications (
  id text primary key,
  job_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.f_findings (
  id text primary key,
  sev text not null check (sev in ('crit','high','mid','low')),
  area text,
  title text not null,
  evidence text,
  fix text,
  man_days numeric not null check (man_days >= 0),
  included boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.f_rfp_items (
  id text primary key,
  label text not null,
  hint text,
  checked boolean default false,
  pos integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.f_vendors (
  id text primary key,
  name text not null,
  price integer,
  scores jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.f_criteria (
  id text primary key,
  label text not null,
  weight integer not null check (weight between 0 and 100),
  pos integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.f_settings (
  id text primary key,
  value integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.a_instructors enable row level security;
grant select, insert, update, delete on public.a_instructors to anon;
drop policy if exists "demo_all" on public.a_instructors;
create policy "demo_all" on public.a_instructors for all to anon using (true) with check (true);

alter table public.a_classes enable row level security;
grant select, insert, update, delete on public.a_classes to anon;
drop policy if exists "demo_all" on public.a_classes;
create policy "demo_all" on public.a_classes for all to anon using (true) with check (true);

alter table public.a_bookings enable row level security;
grant select, insert, update, delete on public.a_bookings to anon;
drop policy if exists "demo_all" on public.a_bookings;
create policy "demo_all" on public.a_bookings for all to anon using (true) with check (true);

alter table public.a_messages enable row level security;
grant select, insert, update, delete on public.a_messages to anon;
drop policy if exists "demo_all" on public.a_messages;
create policy "demo_all" on public.a_messages for all to anon using (true) with check (true);

alter table public.a_rate_jobs enable row level security;
grant select, insert, update, delete on public.a_rate_jobs to anon;
drop policy if exists "demo_all" on public.a_rate_jobs;
create policy "demo_all" on public.a_rate_jobs for all to anon using (true) with check (true);

alter table public.c_users enable row level security;
grant select, insert, update, delete on public.c_users to anon;
drop policy if exists "demo_all" on public.c_users;
create policy "demo_all" on public.c_users for all to anon using (true) with check (true);

alter table public.c_companies enable row level security;
grant select, insert, update, delete on public.c_companies to anon;
drop policy if exists "demo_all" on public.c_companies;
create policy "demo_all" on public.c_companies for all to anon using (true) with check (true);

alter table public.c_quotes enable row level security;
grant select, insert, update, delete on public.c_quotes to anon;
drop policy if exists "demo_all" on public.c_quotes;
create policy "demo_all" on public.c_quotes for all to anon using (true) with check (true);

alter table public.c_quote_joins enable row level security;
grant select, insert, update, delete on public.c_quote_joins to anon;
drop policy if exists "demo_all" on public.c_quote_joins;
create policy "demo_all" on public.c_quote_joins for all to anon using (true) with check (true);

alter table public.c_jobs enable row level security;
grant select, insert, update, delete on public.c_jobs to anon;
drop policy if exists "demo_all" on public.c_jobs;
create policy "demo_all" on public.c_jobs for all to anon using (true) with check (true);

alter table public.c_applications enable row level security;
grant select, insert, update, delete on public.c_applications to anon;
drop policy if exists "demo_all" on public.c_applications;
create policy "demo_all" on public.c_applications for all to anon using (true) with check (true);

alter table public.f_findings enable row level security;
grant select, insert, update, delete on public.f_findings to anon;
drop policy if exists "demo_all" on public.f_findings;
create policy "demo_all" on public.f_findings for all to anon using (true) with check (true);

alter table public.f_rfp_items enable row level security;
grant select, insert, update, delete on public.f_rfp_items to anon;
drop policy if exists "demo_all" on public.f_rfp_items;
create policy "demo_all" on public.f_rfp_items for all to anon using (true) with check (true);

alter table public.f_vendors enable row level security;
grant select, insert, update, delete on public.f_vendors to anon;
drop policy if exists "demo_all" on public.f_vendors;
create policy "demo_all" on public.f_vendors for all to anon using (true) with check (true);

alter table public.f_criteria enable row level security;
grant select, insert, update, delete on public.f_criteria to anon;
drop policy if exists "demo_all" on public.f_criteria;
create policy "demo_all" on public.f_criteria for all to anon using (true) with check (true);

alter table public.f_settings enable row level security;
grant select, insert, update, delete on public.f_settings to anon;
drop policy if exists "demo_all" on public.f_settings;
create policy "demo_all" on public.f_settings for all to anon using (true) with check (true);

-- keepalive 워크플로가 호출하는 가벼운 조회용: a_classes 를 select limit 1
