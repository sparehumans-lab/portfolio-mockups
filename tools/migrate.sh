#!/usr/bin/env bash
# DB 마이그레이션 러너: db/migrations/*.sql 을 번호 순으로 한 번씩만 적용합니다.
# 필요: psql, 환경변수 SUPABASE_DB_URL (Postgres 접속 문자열, 배포 환경 비밀값으로만 보관)
# 규칙: 파일은 추가만 하고 수정하지 않는다. 롤백이 아니라 "앞으로 가는" 새 파일로 고친다.
set -euo pipefail
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL 이 필요합니다}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/db/migrations"
PSQL=(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt)
# --- 연결 진단 (비밀번호는 출력하지 않음) ---
case "$SUPABASE_DB_URL" in
  postgres://*|postgresql://*) ;;
  *) echo "::error::SUPABASE_DB_URL 이 postgresql:// 로 시작하지 않습니다. Supabase Connect 화면의 연결 문자열 전체를 넣었는지 확인하세요"; exit 1;;
esac
case "$SUPABASE_DB_URL" in
  *"[YOUR-PASSWORD]"*|*"YOUR-PASSWORD"*) echo "::error::연결 문자열의 [YOUR-PASSWORD] 를 실제 DB 비밀번호로 바꾸지 않았습니다"; exit 1;;
esac
HOST="$(printf '%s' "$SUPABASE_DB_URL" | sed -E 's#^[a-z]+://[^@]*@([^:/?]+).*#\1#')"
echo "접속 대상 호스트: $HOST"
case "$HOST" in
  db.*.supabase.co) echo "::warning::직접 연결(db.*.supabase.co)은 IPv6 전용이라 GitHub Actions 에서 실패할 수 있습니다. Connect 화면의 Session pooler(...pooler.supabase.com) 문자열을 쓰세요";;
esac
ERR="$(mktemp)"
if ! "${PSQL[@]}" -c "select 1" >/dev/null 2>"$ERR"; then
  echo "::error::DB 연결 실패: $(head -c 400 "$ERR" | tr '\n' ' ')"
  echo "확인: (1) Session pooler 문자열인지 (2) 비밀번호의 특수문자는 URL 인코딩(@ → %40, # → %23, / → %2F) (3) 프로젝트가 일시 중지되지 않았는지"
  exit 1
fi
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
