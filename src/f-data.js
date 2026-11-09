/* ===== f-data.js — 스키마 + 가상 시드 =====
 *  findings   {id,sev,area,title,evidence,fix,manDays,included}
 *  rfpItems   {id,label,hint,checked,pos}
 *  vendors    {id,name,price(백만원),scores{tech,ref,price,sched,mnt}}
 *  criteria   {id,label,weight,pos}
 *  settings   {id:'rate', value(인일 단가)}
 */
var COLS=['findings','rfpItems','vendors','criteria','settings'];
var SEV={crit:'치명',high:'높음',mid:'보통',low:'낮음'};
var F=[
 {id:'F-01',sev:'crit',area:'보안',t:'자녀 계정이 다른 가정의 정산 내역을 조회할 수 있음',ev:'API가 가정 ID를 요청 값으로 받고 서버에서 소속 확인을 하지 않음',fix:'서버에서 로그인 사용자의 가정 소속을 검증하고 조회 범위를 제한',md:3,inc:true},
 {id:'F-02',sev:'crit',area:'결제',t:'결제 웹훅이 중복 도착하면 포인트가 두 번 지급됨',ev:'결제 완료 이벤트의 고유 번호를 저장하지 않아 재처리를 막지 못함',fix:'이벤트 고유 번호 저장 후 멱등 처리, 재처리 테스트 추가',md:2.5,inc:true},
 {id:'F-03',sev:'high',area:'데이터 정합성',t:'동시에 용돈을 보내면 잔액이 어긋남',ev:'잔액을 읽고 계산한 뒤 쓰는 방식이라 같은 순간의 요청이 서로 덮어씀',fix:'DB 트랜잭션과 잠금으로 잔액 갱신을 한 번에 처리',md:3,inc:true},
 {id:'F-04',sev:'high',area:'보안',t:'아동 가입 시 부모 동의 기록이 남지 않음',ev:'동의 화면은 있으나 동의 시각과 버전이 저장되지 않음',fix:'동의 이력 테이블 추가, 약관 버전 관리, 탈퇴 시 보존 규칙 정의',md:2,inc:true},
 {id:'F-05',sev:'mid',area:'인프라',t:'오류 로그와 알림이 없어 장애를 사용자 문의로 알게 됨',ev:'운영 환경에 오류 수집과 알림 설정이 없음',fix:'오류 수집 도구 연결, 결제 실패와 서버 오류 알림 규칙 설정',md:1.5,inc:false},
 {id:'F-06',sev:'mid',area:'UX',t:'미리쓰기와 상환 용어를 아이와 부모가 다르게 이해함',ev:'화면 문구가 금융 용어 중심이고 상환 시점 안내가 없음',fix:'쉬운 문구로 교체하고 상환 일정 안내 화면 추가',md:2,inc:false},
 {id:'F-07',sev:'low',area:'UX',t:'온보딩 3단계에서 이탈 구간이 길음',ev:'프로필 사진 업로드가 필수 입력으로 되어 있음',fix:'선택 입력으로 변경하고 나중에 입력 유도',md:0.5,inc:false},
 {id:'F-08',sev:'low',area:'인프라',t:'백업 복구 절차가 문서화되어 있지 않음',ev:'백업은 있으나 복구 시험 기록이 없음',fix:'복구 절차서 작성과 1회 복구 시험',md:1,inc:false}
];
var VEND=[
 {n:'A사 (소형 스튜디오)',s:{tech:4,ref:3,price:5,sched:4,mnt:3},price:42},
 {n:'B사 (중견 SI)',s:{tech:4,ref:5,price:2,sched:3,mnt:5},price:96},
 {n:'C사 (프리랜서 팀)',s:{tech:3,ref:2,price:5,sched:5,mnt:2},price:35},
 {n:'D사 (솔루션 전문)',s:{tech:5,ref:4,price:3,sched:3,mnt:4},price:68}
];
var CRIT=[['tech','기술 적합성'],['ref','유사 실적'],['price','견적 적정성'],['sched','일정 현실성'],['mnt','유지보수 체계']];
var RFP=[
 ['목적과 성공 기준이 숫자로 적혀 있는가','예: 결제 실패율, 처리 시간, 오픈 날짜',true],
 ['사용자 역할과 권한이 구분되어 있는가','고객사 담당자, 심사원, 운영자 등',true],
 ['업무 흐름이 순서대로 설명되어 있는가','신청부터 종료까지 한 줄로 이어지는지',true],
 ['이번 범위와 제외 범위가 분리되어 있는가','제외 항목이 없으면 견적이 서로 달라집니다',false],
 ['기존 시스템과 데이터 이관 범위가 있는가','이관 대상과 건수, 정합성 확인 방법',false],
 ['외부 연동 대상이 구체적인가','인증, 결제, 알림, 공공 시스템',true],
 ['보안과 개인정보 요구가 있는가','접근 통제, 암호화, 보존 기간',false],
 ['AI 적용 범위와 검증 방법이 있는가','오답 처리, 사람 검토 단계, 책임 소재',false],
 ['검수 기준과 하자보수 조건이 있는가','요구사항별 시험 결과를 증빙으로 받을지',false],
 ['평가 기준과 가중치가 공개되어 있는가','개발사가 무엇을 근거로 제안할지 알 수 있어야 합니다',false]
];

var WEIGHTS={tech:25,ref:25,price:20,sched:15,mnt:15};
function seedData(){
  return {
    findings:F.map(function(f){return {id:f.id,sev:f.sev,area:f.area,title:f.t,evidence:f.ev,fix:f.fix,manDays:f.md,included:f.inc}}),
    rfpItems:RFP.map(function(r,i){return {id:'r'+(i+1),label:r[0],hint:r[1],checked:r[2],pos:i}}),
    vendors:VEND.map(function(v,i){return {id:'v'+(i+1),name:v.n,price:v.price,scores:v.s}}),
    criteria:CRIT.map(function(c,i){return {id:c[0],label:c[1],weight:WEIGHTS[c[0]],pos:i}}),
    settings:[{id:'rate',value:450000}]
  };
}
