/* ===== a-data.js — 스키마 + 가상 시드 (화면 코드와 분리) =====
 * 컬렉션
 *  instructors {id,name}
 *  classes     {id,name,level,instructorId,price}
 *  bookings    {id,classId,customerName,phone,parking,date(YYYY-MM-DD),slot,amount,payMethod,status}
 *  messages    {id,bookingId,body}
 *  rateJobs    {id,classIds[],mode,value,results{classId:ok|fail},status}
 * 모든 문서에 createdAt/updatedAt 자동 부여. 외래키는 id 로만 참조(이름 문자열 저장 금지).
 */
var COLS=['instructors','classes','bookings','messages','rateJobs'];
function isoDate(offset){var d=new Date();d.setDate(d.getDate()+offset);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function seedData(){
  return {
    instructors:[{id:'i1',name:'한서윤'},{id:'i2',name:'오지민'},{id:'i3',name:'윤하은'}],
    classes:[
      {id:'c1',name:'입문 발레 기초',level:'입문',instructorId:'i1',price:35000},
      {id:'c2',name:'성인 클래식 바워크',level:'초중급',instructorId:'i2',price:38000},
      {id:'c3',name:'포인트 워크 입문',level:'중급',instructorId:'i1',price:42000},
      {id:'c4',name:'바렐 스트레칭',level:'전체',instructorId:'i3',price:30000}
    ],
    bookings:[
      {id:'R-1042',classId:'c1',customerName:'김하린',phone:'010-1111-2222',parking:false,date:isoDate(1),slot:'19:30',amount:35000,payMethod:'카카오페이',status:'확정'},
      {id:'R-1043',classId:'c2',customerName:'이도윤',phone:'010-3333-4444',parking:false,date:isoDate(2),slot:'14:00',amount:38000,payMethod:'네이버페이',status:'확정'},
      {id:'R-1044',classId:'c4',customerName:'박서아',phone:'010-5555-6666',parking:true,date:isoDate(2),slot:'20:50',amount:30000,payMethod:'카카오페이',status:'대기'},
      {id:'R-1045',classId:'c3',customerName:'최유나',phone:'010-7777-8888',parking:false,date:isoDate(3),slot:'19:30',amount:42000,payMethod:'네이버페이',status:'취소'}
    ],
    messages:[],
    rateJobs:[]
  };
}
