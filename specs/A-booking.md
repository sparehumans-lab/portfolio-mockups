# A. 플리에 스튜디오 — 예약·결제·요금 일괄 변경

## 목적
공고 유형: 예약·결제·관리자 요금 변경·문자 알림·주차 연동. 심사자가 5분 안에 “예약이 DB에 쌓이고, 관리자가 요금을 안전하게 바꾸는 흐름”을 확인.

## 기술 스펙
- 화면: 고객(5단계), 관리자(예약 목록 / 요금 일괄 변경 / 알림 기록)
- 상태: UI 상태 `S`(단계·선택값) / 영속 데이터는 `Repo` 만 사용
- 결제: 가상 PG 선택 화면, 승인 즉시 `bookings.status='확정'`
- 문자: 외부 발송 없음. `messages` 에 본문 저장 후 미리보기
- 요금 일괄 변경: 대상 선택 → 비율/금액 → 변경 전후 미리보기 → 적용
  - 1,000원 미만 결과 차단
  - 항목별 결과를 `rate_jobs.results{classId:ok|fail}` 에 기록, 실패 항목만 재전송
  - 동일 작업 재적용 차단(작업 상태 `done` 이면 버튼 비활성)

## 테이블
| 테이블 | 컬럼 |
|---|---|
| a_instructors | id, name |
| a_classes | id, name, level, instructor_id, price(≥0) |
| a_bookings | id, class_id, customer_name, phone, parking, date, slot, amount(≥0), pay_method, status(확정/대기/취소) |
| a_messages | id, booking_id, body |
| a_rate_jobs | id, class_ids(jsonb), mode(pct/won), value, results(jsonb), status |

## 남은 구현 작업 (현재 대비)
1. 슬롯 마감을 임의 규칙 대신 `a_bookings` 의 (date, slot) 중복 집계로 계산 → 같은 시간 중복 예약 방지
2. 요금 변경 이력 보기(`rate_jobs` 목록)
3. 예약 상세 + 취소 시 환불 상태 표기(가상)
4. 오류 상태 화면(DB 쓰기 실패 토스트: `repo.onError` 연결)
5. 접근성 점검(탭 순서, aria 상태)

## 수용 기준
- 예약 완료 후 새로고침해도 관리자 목록에 남는다
- 요금 변경 2번째 항목 실패 → 실패 1건만 재전송 → 모두 반영
- 같은 날짜·시간 두 번째 예약은 선택 불가(작업 1 이후)

## 공고에 설명할 포인트
부분 실패 복구, 중복 실행 차단, 외부 주차 서비스 연동 가능성 확인 후 범위 확정이라는 진행 방식
