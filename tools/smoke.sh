#!/usr/bin/env bash
# 배포 후 점검. 사용: tools/smoke.sh <BASE_URL> [기대 버전]
# 1) 페이지 4종 200  2) version.json 이 기대 버전과 일치  3) (선택) DB REST 응답
set -euo pipefail
BASE="${1:?BASE_URL 필요}"; BASE="${BASE%/}"; WANT="${2:-}"
fail=0
for p in "" a-booking.html c-matching.html f-samples.html version.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --retry 3 --retry-delay 5 "$BASE/$p" || echo 000)
  echo "$code  /$p"; [ "$code" = "200" ] || fail=1
done
if [ -n "$WANT" ]; then
  got=$(curl -fsS "$BASE/version.json" | python3 -c 'import json,sys;print(json.load(sys.stdin)["version"])')
  echo "version: $got (expected $WANT)"; [ "$got" = "$WANT" ] || fail=1
fi
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_ANON_KEY:-}" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SUPABASE_URL/rest/v1/a_classes?select=id&limit=1" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" || echo 000)
  echo "$code  DB REST"; [ "$code" = "200" ] || fail=1
fi
[ "$fail" = "0" ] && echo "SMOKE OK" || { echo "SMOKE FAILED"; exit 1; }
