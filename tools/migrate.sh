#!/usr/bin/env bash
# DB 마이그레이션 러너: db/migrations/*.sql 을 번호 순으로 한 번씩만 적용합니다.
# 필요: psql, 환경변수 SUPABASE_DB_URL (Postgres 접속 문자열, 배포 환경 비밀값으로만 보관)
# 규칙: 파일은 추가만 하고 수정하지 않는다. 롤백이 아니라 "앞으로 가는" 새 파일로 고친다.
set -euo pipefail
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL 이 필요합니다}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/db/migrations"
PSQL=(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt)
"${PSQL[@]}" -c "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now());"
applied=0
for f in $(ls "$DIR"/*.sql | sort); do
  name="$(basename "$f")"
  done_flag="$("${PSQL[@]}" -c "select 1 from public.schema_migrations where name='$name'")"
  if [ -n "$done_flag" ]; then echo "skip   $name"; continue; fi
  echo "apply  $name"
  "${PSQL[@]}" -1 -f "$f" -c "insert into public.schema_migrations(name) values ('$name')"
  applied=$((applied+1))
done
echo "migrations applied: $applied"
