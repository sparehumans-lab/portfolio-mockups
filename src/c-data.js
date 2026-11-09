/* ===== c-data.js — 스키마 + 가상 시드 =====
 *  users        {id,name,roles{cust,biz,work},area,days,career}      한 계정에 여러 역할
 *  companies    {id,name,ownerId,area,status(승인|대기|반려)}
 *  quotes       {id,type,area,size,date,cap,note,requesterId,status,result}
 *  quoteJoins   {id,quoteId,companyId}                               견적 참여(정원 계산 근거)
 *  jobs         {id,title,area,when,pay,need,companyId}
 *  applications {id,jobId,userId}
 */
var COLS=['users','companies','quotes','quoteJoins','jobs','applications'];
function seedData(){
  return {
    users:[
      {id:'u1',name:'박도현',roles:{cust:true,biz:true,work:true},area:'서울 강남',days:'평일 오전',career:3},
      {id:'u2',name:'(주)가온 사무실',roles:{cust:true},area:'서울 마포',days:'',career:0},
      {id:'u3',name:'이서윤',roles:{cust:true},area:'경기 성남',days:'',career:0},
      {id:'u4',name:'한상원',roles:{cust:true},area:'서울 강남',days:'',career:0},
      {id:'u5',name:'정민호',roles:{work:true},area:'서울 강남',days:'주말',career:5}
    ],
    companies:[
      {id:'k1',name:'정리의 기술',ownerId:'u6',area:'서울 마포',status:'승인'},
      {id:'k2',name:'반짝반짝 클린',ownerId:'u7',area:'서울 강남',status:'승인'},
      {id:'k3',name:'도현 클린팀',ownerId:'u1',area:'서울 강남',status:'승인'},
      {id:'k4',name:'새빛 청소',ownerId:'u8',area:'경기 성남',status:'대기'}
    ],
    quotes:[
      {id:'Q-201',type:'사무실 정기 청소',area:'서울 마포',size:62,date:'11/12',cap:3,note:'주 2회, 야간 가능',requesterId:'u2',status:'상담 중',result:''},
      {id:'Q-202',type:'가정집 입주 청소',area:'경기 성남',size:34,date:'11/15',cap:3,note:'새집 증후군 케어 문의',requesterId:'u1',status:'마감',result:''},
      {id:'Q-203',type:'상가 · 식당 청소',area:'서울 강남',size:48,date:'11/09',cap:2,note:'영업 종료 후 작업',requesterId:'u4',status:'모집 중',result:''}
    ],
    quoteJoins:[
      {id:'QJ-1',quoteId:'Q-201',companyId:'k1'},
      {id:'QJ-2',quoteId:'Q-202',companyId:'k2'},{id:'QJ-3',quoteId:'Q-202',companyId:'k1'},{id:'QJ-4',quoteId:'Q-202',companyId:'k3'}
    ],
    jobs:[
      {id:'J-31',title:'오피스텔 입주 청소 보조',area:'서울 강남',when:'11/10 09:00',pay:'일 13만원',need:2,companyId:'k2'},
      {id:'J-32',title:'식당 후드 청소 작업자',area:'경기 고양',when:'11/11 22:00',pay:'일 15만원',need:1,companyId:'k1'}
    ],
    applications:[{id:'AP-1',jobId:'J-31',userId:'u5'}]
  };
}
