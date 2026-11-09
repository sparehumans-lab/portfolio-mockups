# 05. 배포 프로세스 (운영 고려)

기준 공고: Azure Databricks 기반 MLOps 환경 구축 (위시켓 159534).
공고의 핵심 흐름 **Registry 등록 → 변환 → 컨테이너 이미지 → 레지스트리 푸시 → 배포 → 전 과정 자동화(CI/CD)** 를
이 포트폴리오의 릴리스 파이프라인에 같은 구조로 적용했습니다. 대상 산출물만 다릅니다(ML 모델 ↔ 웹 데모 + DB 스키마).

## 1. 공고 요구와 대응
| 공고 과업 | 이 프로젝트의 대응 | 구현 위치 |
|---|---|---|
| 실험 추적·버전 관리 | 모든 빌드에 버전·커밋·환경 기록(`version.json`), 화면 하단 표시 | `build.py`, `docs/version.json` |
| Unity Catalog 권한 체계 | 환경별 권한 분리: 마이그레이션(DB 직접 접속)은 승인된 잡만, 빌드는 공개 키만, 서비스 키는 저장소에 없음 | GitHub Environments, `deploy.yml` |
| Model Registry 버전·별칭 | Git 태그 `vX.Y.Z` = 버전, `main` = staging 별칭, 승인된 태그 = production 별칭. 빌드 산출물은 90일 보관 | `deploy.yml`(plan, upload-artifact) |
| ONNX 변환(배포용 포맷으로 변환) | 소스(`src/` 모듈) → 단일 HTML 빌드, 환경별 DB 설정 주입 | `build.py` |
| 컨테이너 이미지 → ACR 푸시 | nginx 이미지 빌드 → GHCR 푸시(태그=버전) | `container.yml`, `deploy/Dockerfile` |
| IoT Hub 엣지 배포 | GitHub Pages 배포, 또는 서버(VPS)에서 `docker compose` 로 이미지 태그 지정 배포 | `deploy-production`, `deploy/docker-compose.yml` |
| 전 과정 CI/CD 자동화 | PR 검증 → main(staging) → 태그(production) → 배포 후 점검 | `ci.yml`, `deploy.yml` |
| 실제 환경 테스트 완료 | 배포 후 점검: 페이지 200, 배포 버전 일치, DB REST 응답 | `tools/smoke.sh` |

주의: 위 대응은 **배포 프로세스의 구조**를 보여주는 것이며, Azure Databricks·MLflow·ONNX·IoT Hub를 실제로 다룬 경험을 대신하지 않습니다. 해당 공고 지원 시 이 항목은 "유사 구조의 CI/CD 구축 경험"으로 정직하게 서술하고, 공고 필수 항목(Databricks, 엣지 배포 실적)은 별도 실적이 있을 때만 적습니다.

## 2. 환경과 승급 경로
```
브랜치 → PR ──ci.yml──▶ 병합(main) ──deploy.yml──▶ staging ──(태그 vX.Y.Z)──▶ production
         검증·E2E                 빌드·E2E·staging DB 마이그레이션        빌드·E2E → 승인 → 마이그레이션 → Pages → 점검
```
| 환경 | 트리거 | DB | 공개 배포 | 승인 |
|---|---|---|---|---|
| local | 수동 | 메모리 또는 개발 DB | 없음 | - |
| staging | main 병합 | staging 프로젝트 | 없음(빌드 산출물과 E2E 결과만) | 없음 |
| production | `v*.*.*` 태그 또는 수동 | production 프로젝트 | GitHub Pages(+선택 GHCR 이미지) | production Environment 승인 1회 |

## 3. 릴리스 절차
1. 브랜치에서 작업 → PR. `ci.yml` 통과 필수(스키마 드리프트, 시드↔컬럼, 마이그레이션 규칙, 쉘 문법, E2E 3종).
2. 병합하면 staging 자동 실행. 실패 시 태그를 만들지 않는다.
3. 릴리스: `git tag v1.2.0 && git push origin v1.2.0`
4. production 잡이 승인 대기 → 승인하면 마이그레이션 → Pages 배포 → `smoke.sh`(버전 일치까지 확인).
5. 컨테이너 경로: 같은 태그로 `container.yml` 이 `ghcr.io/<owner>/<repo>:v1.2.0` 을 푸시.

## 4. DB 변경 규칙 (마이그레이션)
- 스키마 변경은 `db/migrations/NNN_설명.sql` 새 파일만 추가. 기존 파일은 수정 금지.
- 적용 이력은 `schema_migrations` 테이블에 기록, 러너는 미적용 파일만 순서대로 1회 실행(트랜잭션 단위).
- 2단계 변경(expand → contract): 새 컬럼 추가 배포 → 코드 전환 → 다음 릴리스에서 옛 컬럼 삭제. 이 규칙이 있어야 코드만 되돌려도 DB와 맞는다.
- `db/schema.sql`·`001_init.sql` 은 `tools/gen_schema.py` 생성물. 정의를 바꾸면 생성 후 커밋(CI 가 드리프트를 검사).

## 5. 되돌리기(롤백)
- 코드: Actions > deploy > Run workflow, `ref` 에 직전 정상 태그, `environment=production`. 해당 태그를 다시 빌드·배포하고 마이그레이션은 이미 적용돼 건너뜀.
- 컨테이너: 서버에서 `IMAGE_TAG=v1.1.0 docker compose up -d`.
- DB: 되돌리지 않는다. 4번 규칙(expand/contract)으로 이전 코드가 새 스키마에서도 동작하게 유지. 데이터 손상 시 Supabase 백업 복원(무료 플랜의 백업 제공 범위는 가입 시점에 확인).
- 판단 기준: 배포 후 점검 실패 또는 화면 핵심 흐름 오류 → 즉시 직전 태그로 되돌리고 원인은 이후에 분석.

## 6. 비밀값·권한(최소 권한)
| 값 | 위치 | 사용처 |
|---|---|---|
| `PROD_/STAGING_SUPABASE_URL`, `..._ANON_KEY` | 저장소 Secrets | 빌드 시 HTML 주입, 점검(공개용 값) |
| `SUPABASE_DB_URL` | 각 Environment Secrets | 마이그레이션 잡에서만 |
| Supabase `service_role` | 어디에도 저장하지 않음 | 사용 안 함 |
| `GITHUB_TOKEN` | 자동 | Pages·GHCR(워크플로별 최소 permissions) |
- production Environment: Required reviewers(본인 또는 지정자), 태그 패턴 `v*.*.*` 에서만 배포 허용(Deployment branches and tags).
- 브랜치 보호: main 직접 푸시 금지, `ci` 통과 필수.

## 7. 운영 점검
- 매일: `keepalive.yml` 이 DB 조회(무료 DB 일시 중지 방지). 실패하면 Actions 알림 메일.
- 배포마다: `smoke.sh` 결과가 Actions 요약에 남음.
- 월 1회: 의존 버전(Actions 버전, Node, Python) 확인, anon 키 노출 범위·RLS 정책 재검토, 데이터 초기화 동작 확인.
- 장애 대응: ① 화면 하단 상태 표시줄로 DB/메모리 모드 구분 ② Supabase 상태·일시 중지 확인 ③ 필요 시 직전 태그 재배포.

## 8. 최초 1회 설정 체크리스트
1. Supabase 프로젝트 2개(staging, production) 생성, 각각 `db/migrations/001_init.sql` 은 첫 배포가 적용(수동 실행 불필요)
2. 저장소 Secrets 4종 + 각 Environment 에 `SUPABASE_DB_URL`
3. Settings > Pages > Source: GitHub Actions
4. Environments: `production`(Required reviewers, 태그 제한), `staging`, `github-pages`(규칙 없음)
5. 브랜치 보호 규칙, 첫 태그 `v0.1.0`
6. (선택) Hostinger VPS: Docker 설치 후 `deploy/docker-compose.yml` 의 이미지 경로 수정
