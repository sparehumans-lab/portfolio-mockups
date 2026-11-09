#!/usr/bin/env python3
"""데모 3종의 테이블 정의 -> db/schema.sql 생성. 컬럼 규칙은 src/repo.js 의 camel->snake 와 같다(when -> when_at)."""
import os
T = {
 'a': {
  'instructors': [('name','text not null')],
  'classes': [('name','text not null'),('level','text'),('instructor_id','text'),('price','integer not null check (price >= 0)')],
  'bookings': [('class_id','text not null'),('customer_name','text not null'),('phone','text'),('parking','boolean default false'),('date','text not null'),('slot','text not null'),('amount','integer not null check (amount >= 0)'),('pay_method','text'),("status","text not null check (status in ('확정','대기','취소'))")],
  'messages': [('booking_id','text'),('body','text not null')],
  'rate_jobs': [('class_ids','jsonb'),('mode',"text check (mode in ('pct','won'))"),('value','integer'),('results','jsonb'),('status','text')],
 },
 'c': {
  'users': [('name','text not null'),('roles','jsonb'),('area','text'),('days','text'),('career','integer default 0')],
  'companies': [('name','text not null'),('owner_id','text'),('area','text'),("status","text not null check (status in ('승인','대기','반려'))")],
  'quotes': [('type','text not null'),('area','text not null'),('size','integer check (size > 0)'),('date','text'),('cap','integer not null check (cap between 1 and 5)'),('note','text'),('requester_id','text not null'),('status','text not null'),('result','text default \'\'')],
  'quote_joins': [('quote_id','text not null'),('company_id','text not null')],
  'jobs': [('title','text not null'),('area','text'),('when_at','text'),('pay','text'),('need','integer check (need > 0)'),('company_id','text not null')],
  'applications': [('job_id','text not null'),('user_id','text not null')],
 },
 'f': {
  'findings': [('sev',"text not null check (sev in ('crit','high','mid','low'))"),('area','text'),('title','text not null'),('evidence','text'),('fix','text'),('man_days','numeric not null check (man_days >= 0)'),('included','boolean default false')],
  'rfp_items': [('label','text not null'),('hint','text'),('checked','boolean default false'),('pos','integer')],
  'vendors': [('name','text not null'),('price','integer'),('scores','jsonb')],
  'criteria': [('label','text not null'),('weight','integer not null check (weight between 0 and 100)'),('pos','integer')],
  'settings': [('value','integer not null')],
 },
}
out = ['-- 자동 생성: tools/gen_schema.py  (Supabase SQL Editor 에서 한 번 실행)',
       '-- 포트폴리오 데모용: 방문자(anon)에게 읽기/쓰기를 모두 허용합니다. 실제 서비스 데이터는 넣지 마세요.', '']
names = []
for ns, tabs in T.items():
    for t, cols in tabs.items():
        name = f'{ns}_{t}'; names.append(name)
        body = ',\n'.join(['  id text primary key'] + [f'  {c} {d}' for c, d in cols] +
                          ['  created_at timestamptz not null default now()', '  updated_at timestamptz not null default now()'])
        out.append(f'create table if not exists public.{name} (\n{body}\n);')
out.append('')
for n in names:
    out += [f'alter table public.{n} enable row level security;',
            f'grant select, insert, update, delete on public.{n} to anon;',
            f'drop policy if exists "demo_all" on public.{n};',
            f'create policy "demo_all" on public.{n} for all to anon using (true) with check (true);', '']
out.append('-- keepalive 워크플로가 호출하는 가벼운 조회용: a_classes 를 select limit 1')
os.makedirs('db', exist_ok=True)
txt = '\n'.join(out) + '\n'
open('db/schema.sql', 'w', encoding='utf-8').write(txt)
os.makedirs('db/migrations', exist_ok=True)
open('db/migrations/001_init.sql', 'w', encoding='utf-8').write(txt)
print(len(names), 'tables')
