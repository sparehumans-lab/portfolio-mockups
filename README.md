# 포트폴리오 목업 (위시켓 지원용)

가상 서비스 3종의 동작 프로토타입. 정적 화면(GitHub Pages) + 클라우드 DB(Supabase 무료)로 구성합니다.

## 구조
```
src/        repo.js(데이터 계층) · *-data.js(스키마·시드) · *-app.js(화면) · *-template.html · index.html
db/         schema.sql (tools/gen_schema.py 로 생성)
docs/       빌드 결과 = GitHub Pages 배포 폴더
specs/      00-foundation · A · C · F 기술 스펙 · 05-deploy-process
deploy/     Dockerfile · nginx.conf · docker-compose.yml (선택: 컨테이너 배포)
.github/    ci · deploy · container · keepalive 워크플로
tools/      gen_schema.py · check_cols.js · mock_test.js · migrate.sh(DB 마이그레이션) · smoke.sh(배포 후 점검) · e2e/(브라우저 시험)
build.py    src -> docs 단일 HTML 빌드
```

## 최초 설정 (한 번만)
1. Supabase 프로젝트 생성 → SQL Editor 에 `db/schema.sql` 실행
2. Project Settings > API 의 **Project URL** 과 **anon public key** 를 `config.json` 에 입력 (anon 키는 공개용이며 RLS 로 보호)
3. `python3 build.py` → `docs/` 생성
4. GitHub 공개 저장소에 push → Settings > Pages > Branch `main` / Folder `/docs`
5. Secrets 등록과 환경 구성은 `specs/05-deploy-process.md` 8장 참고 (keepalive 는 `PROD_SUPABASE_URL`, `PROD_SUPABASE_ANON_KEY` 사용)
6. 첫 접속 시 테이블이 비어 있으면 시드가 자동 입력됩니다

## 동작 규칙
- `config.json` 이 비어 있거나 DB 연결 실패 시 브라우저 메모리 모드로 자동 전환 (화면 하단 표시줄에 상태 표기)
- 화면 하단 “데이터 초기화” = 해당 데모 테이블 전체 삭제 후 시드 재주입
- `service_role` 키는 절대 저장소에 넣지 않습니다

## 배포·운영
태그 `vX.Y.Z` 푸시 → 승인 → 마이그레이션 → Pages 배포 → 점검. 되돌리기는 deploy 워크플로를 이전 태그로 수동 실행. 자세한 내용은 `specs/05-deploy-process.md`.

## 검증
```
python3 tools/gen_schema.py && node tools/check_cols.js .   # 시드 필드 ↔ SQL 컬럼 일치
```
