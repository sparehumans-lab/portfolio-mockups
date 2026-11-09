# 00. 공통 기반 스펙

## 아키텍처
브라우저(GitHub Pages 정적 HTML) → Supabase REST(PostgREST, anon 키) → Postgres(RLS)

| 층 | 선택 | 근거 |
|---|---|---|
| 화면 | 단일 HTML, 바닐라 JS, 이벤트 위임 | 빌드 도구 없이 바로 열림, 심사자가 소스 확인 가능 |
| 데이터 접근 | `Repo` (list/get/create/update/remove/reset) | 화면과 저장소 분리, 어댑터 교체 |
| 어댑터 | memory / supabase(fetch 직접 호출) | 외부 SDK 없음, 연결 실패 시 memory 폴백 |
| DB | Supabase 무료 Postgres | RLS, 자동 REST, 무료 |
| 배포 | GitHub Pages `/docs` | 무료, 고정 주소 |
| 유지 | GitHub Actions 일 1회 조회 | 7일 무활동 일시 중지 방지 |

## 규칙
- 테이블명 `{데모접두어}_{snake_case 컬렉션}` (a_, c_, f_)
- JS camelCase ↔ DB snake_case 자동 변환, 예약어 `when` → `when_at`
- 문서 id: 메모리 모드 `접두어-순번`, DB 모드 `접두어-순번-랜덤4자`(동시 방문자 충돌 방지)
- 모든 행에 `created_at`, `updated_at`
- 쓰기는 문서 단위로 순서 보장(큐), 실패 시 콘솔 경고 + `onError` 훅
- 외래키 컬럼은 id 문자열만 저장. DB 수준 FK 제약은 두지 않음(데이터 초기화 시 삭제 순서 문제). 실서비스 전환 시 FK 추가

## 보안(포트폴리오용 한정)
- anon 에 전 테이블 CRUD 허용 → 누구나 데이터 변경 가능. 대신 컬럼 CHECK(금액 ≥ 0, 상태 값 제한 등)와 “데이터 초기화”로 복구
- 개인정보 입력 금지 안내를 화면에 상시 표기
- 서비스 키는 클라이언트에 두지 않음
- 후속 강화안: 방문자별 `session_id` 컬럼 + RLS `session_id = 헤더 값` 으로 데이터 격리

## 완료 기준(공통)
1. 새 브라우저에서 목차 → 각 데모 접속, 로그인 없이 동작
2. 입력 후 새로고침해도 데이터 유지(DB 모드)
3. DB 차단 시 메모리 모드로 열리고 상태 표시
4. 모바일 폭(400px)에서 가로 스크롤 없음
