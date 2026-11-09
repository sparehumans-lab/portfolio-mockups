# C. 말끔 — 청소 매칭 플랫폼

## 목적
공고 유형: 견적 요청 매칭, 업체 정원제, 구인구직, 한 계정 다중 역할, 운영자 수기 기록(베타).

## 기술 스펙
- 화면: 역할 전환(고객/업체/작업자/운영자). 계정은 1개(`users.roles`)
- 견적: 요청 → 업체 참여(`quote_joins`) → 정원 도달 시 `quotes.status='마감'`
- 연락처 가림: 참여한 업체에게만 노출(화면 규칙)
- 구인: 업체가 공고 작성(`jobs`), 작업자 지원(`applications`), 자기 업체 공고 지원 차단
- 운영자: 계약 결과(`quotes.result`) 기록, 업체 승인/반려(`companies.status`)
- 정원 초과 방지: 현재는 화면에서 확인 후 삽입. 실서비스 전환 시 DB 함수(원자적 insert)로 이동

## 테이블
| 테이블 | 컬럼 |
|---|---|
| c_users | id, name, roles(jsonb), area, days, career |
| c_companies | id, name, owner_id, area, status(승인/대기/반려) |
| c_quotes | id, type, area, size(>0), date, cap(1~5), note, requester_id, status, result |
| c_quote_joins | id, quote_id, company_id |
| c_jobs | id, title, area, when_at, pay, need(>0), company_id |
| c_applications | id, job_id, user_id |

## 남은 구현 작업
1. 동시 참여 경합 대응: 참여 직전 DB 재조회로 정원 재확인(데모), 설명용 SQL 함수 `join_quote()` 문서화
2. 견적 상태 전이 규칙표(모집 중→마감→상담 중→계약/불발) 구현 및 운영자 화면 반영
3. 업체/작업자 역할 보유 여부에 따른 메뉴 노출 제어
4. 구인 공고 표시사항(신고번호 등) 입력란과 하단 노출
5. 알림톡 발송 기록 컬렉션(`c_notifications`) 추가: 견적 등록·참여 시 가상 발송 내역 표시

## 수용 기준
- 정원 3인 견적에 4번째 업체 참여 불가
- 참여 후 고객 화면 타임라인에 업체명 노출, 연락처는 참여 업체에만 보임
- 운영자가 계약 결과를 기록하면 집계 문구가 갱신되고 새로고침 후에도 유지

## 공고에 설명할 포인트
역할/계정 분리 설계, 정원 경합 처리, 수기 운영 → 자동화 단계 구분, 법 개정 대비 확장 구조
