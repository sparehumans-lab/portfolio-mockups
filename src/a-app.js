(function(){
var fmt=function(n){return n.toLocaleString('ko-KR')+'원'};
var DOW=['일','월','화','수','목','금','토'];
function mkDates(){var a=[];for(var i=1;a.length<7;i++){var iso=isoDate(i),x=new Date(iso+'T00:00:00');a.push({key:iso,label:(x.getMonth()+1)+'월 '+x.getDate()+'일 ('+DOW[x.getDay()]+')'})}return a}
var DATES=mkDates();
var SLOTS=['10:30','14:00','19:30','20:50'];
var repo=Repo.make(Repo.fromConfig('a'),seedData);
var S={view:'customer',step:1,cls:null,date:null,slot:null,name:'',phone:'',parking:false,pay:'naver',err:'',tab:'bookings',last:null,
  rate:{sel:{c1:true,c2:true,c3:false,c4:false},mode:'pct',val:10,jobId:null}};
var failOnce=true;
var $=function(s){return document.querySelector(s)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(function(){t.hidden=true},2400)}
function taken(date,slot){return (Number(date.slice(-2))+SLOTS.indexOf(slot))%4===0} /* 날짜마다 정확히 한 슬롯이 마감 */
function clsById(id){return repo.get('classes',id)}
function classes(){return repo.list('classes')}
function instrName(c){var i=repo.get('instructors',c.instructorId);return i?i.name:'-'}
function shortDate(iso){var p=iso.split('-');return Number(p[1])+'/'+Number(p[2])}
function whenOf(b){return shortDate(b.date)+' '+b.slot}
function bookings(){return repo.list('bookings')}
function messages(){return repo.list('messages').sort(function(a,b){return a.createdAt<b.createdAt?1:-1})}
function curJob(){return S.rate.jobId?repo.get('rateJobs',S.rate.jobId):null}

function stepper(){
  var n=['수업','일정','정보','결제','완료'];
  return '<ol class="steps" aria-label="예약 단계">'+n.map(function(t,i){var k=i+1;return '<li class="'+(k===S.step?'on':k<S.step?'done':'')+'"'+(k===S.step?' aria-current="step"':'')+'>'+k+'. '+t+'</li>'}).join('')+'</ol>'
}
function customer(){
  var h='<h2>수업 예약</h2><p class="sub">수업과 시간을 고르고 결제까지 한 번에 마칩니다.</p>'+stepper();
  if(S.step===1){
    h+='<div class="grid">'+classes().map(function(c){
      return '<button class="card pick" data-act="pickcls" data-id="'+c.id+'" aria-pressed="'+(S.cls===c.id)+'"><h3>'+esc(c.name)+'</h3><div class="meta">'+c.level+' · 강사 '+esc(instrName(c))+'</div><div class="price" style="margin-top:8px">'+fmt(c.price)+' <span class="meta">/ 1회</span></div></button>'}).join('')+'</div>';
    h+='<div class="row"><button class="btn primary" data-act="next" '+(S.cls?'':'disabled')+'>다음: 일정 선택</button></div>';
  }
  if(S.step===2){
    h+='<label class="f" id="lbl-date">날짜</label><div class="chips" role="group" aria-labelledby="lbl-date">'+DATES.map(function(d){return '<button class="chip" data-act="pickdate" data-k="'+d.key+'" aria-pressed="'+(S.date===d.key)+'">'+d.label+'</button>'}).join('')+'</div>';
    h+='<label class="f" id="lbl-slot">시간 (마감된 시간은 선택할 수 없습니다)</label><div class="chips" role="group" aria-labelledby="lbl-slot">'+SLOTS.map(function(s){var dis=!S.date||taken(S.date,s);return '<button class="chip" data-act="pickslot" data-s="'+s+'" '+(dis?'disabled':'')+' aria-pressed="'+(S.slot===s)+'">'+s+'</button>'}).join('')+'</div>';
    if(!S.date)h+='<p class="small">날짜를 먼저 선택하세요.</p>';
    h+='<div class="row"><button class="btn" data-act="back">이전</button><button class="btn primary" data-act="next" '+(S.date&&S.slot?'':'disabled')+'>다음: 정보 입력</button></div>';
  }
  if(S.step===3){
    h+='<label class="f" for="in-name">이름</label><input id="in-name" type="text" autocomplete="name" value="'+esc(S.name)+'" placeholder="예: 김하린">';
    h+='<label class="f" for="in-phone">휴대폰 번호 (예약 문자 수신)</label><input id="in-phone" type="tel" inputmode="numeric" value="'+esc(S.phone)+'" placeholder="010-0000-0000">';
    h+='<label class="f" style="display:flex;gap:8px;align-items:center;color:var(--fg)"><input id="in-park" type="checkbox" '+(S.parking?'checked':'')+'> 주차 지원이 필요합니다</label>';
    h+='<div class="note">주차 지원은 차량번호를 받아 주차 시스템에 등록하는 방식이 필요합니다. 외부 주차 서비스와 연동이 가능한지는 해당 서비스의 제휴 방식 확인 후 범위와 비용을 확정합니다. 이 데모에서는 요청만 기록합니다.</div>';
    h+='<p class="err" id="err" role="alert">'+esc(S.err)+'</p>';
    h+='<div class="row" style="margin-top:4px"><button class="btn" data-act="back">이전</button><button class="btn primary" data-act="next">다음: 결제</button></div>';
  }
  if(S.step===4){
    var c=clsById(S.cls);
    h+='<div class="card" style="max-width:520px"><dl class="sum"><dt>수업</dt><dd>'+esc(c.name)+'</dd><dt>일정</dt><dd>'+shortDate(S.date)+' '+S.slot+'</dd><dt>예약자</dt><dd>'+esc(S.name)+'</dd><dt>주차 지원</dt><dd>'+(S.parking?'요청':'없음')+'</dd><dt>결제 금액</dt><dd class="price">'+fmt(c.price)+'</dd></dl></div>';
    h+='<label class="f" id="lbl-pay">결제 수단 (가상)</label><div class="pay" role="group" aria-labelledby="lbl-pay"><button class="card pick" data-act="pickpay" data-p="naver" aria-pressed="'+(S.pay==='naver')+'"><b>네이버페이</b><div class="meta">간편결제 화면 예시</div></button><button class="card pick" data-act="pickpay" data-p="kakao" aria-pressed="'+(S.pay==='kakao')+'"><b>카카오페이</b><div class="meta">간편결제 화면 예시</div></button></div>';
    h+='<div class="row"><button class="btn" data-act="back">이전</button><button class="btn primary" data-act="pay">'+fmt(c.price)+' 결제하기 (가상)</button></div>';
  }
  if(S.step===5&&S.last){
    var b=repo.get('bookings',S.last);
    h+='<div class="card" style="max-width:520px"><span class="tag ok">예약 완료</span><h3 style="margin-top:8px">예약번호 '+b.id+'</h3><div class="meta">'+esc(clsById(b.classId).name)+' · '+whenOf(b)+'</div></div>';
    h+='<h2 style="font-size:17px;margin-top:20px">발송되는 예약 문자 (미리보기)</h2><div class="sms">'+esc((messages()[0]||{}).body||'')+'</div>';
    h+='<p class="small">관리자 화면의 예약 목록에 방금 예약이 추가되었습니다.</p>';
    h+='<div class="row"><button class="btn primary" data-act="again">새 예약 만들기</button><button class="btn" data-act="view" data-v="admin">관리자 화면에서 보기</button></div>';
  }
  return h
}
function statusTag(s){return '<span class="tag '+(s==='확정'?'ok':s==='대기'?'warn':'bad')+'">'+s+'</span>'}
function admin(){
  var tabs=[['bookings','예약 목록'],['rates','요금 일괄 변경'],['sms','알림 기록']];
  var h='<h2>관리자</h2><p class="sub">예약 현황을 확인하고 수업 요금을 한 번에 바꿉니다.</p><div class="tabs" role="tablist">'+tabs.map(function(t){return '<button role="tab" data-act="tab" data-t="'+t[0]+'" aria-selected="'+(S.tab===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>';
  if(S.tab==='bookings'){
    var BK=bookings(),ok=BK.filter(function(b){return b.status==='확정'}),sum=ok.reduce(function(a,b){return a+b.amount},0);
    h+='<div class="stats"><div class="card stat"><span class="meta">전체 예약</span><b>'+BK.length+'</b></div><div class="card stat"><span class="meta">확정</span><b>'+ok.length+'</b></div><div class="card stat"><span class="meta">확정 매출</span><b>'+fmt(sum)+'</b></div></div>';
    h+='<div class="tablewrap"><table><thead><tr><th>예약번호</th><th>예약자</th><th>수업</th><th>일정</th><th class="num">금액</th><th>상태</th><th>처리</th></tr></thead><tbody>'+
    BK.slice().reverse().map(function(b){return '<tr><td>'+b.id+'</td><td>'+esc(b.customerName)+'</td><td>'+esc(clsById(b.classId).name)+'</td><td>'+whenOf(b)+'</td><td class="num">'+fmt(b.amount)+'</td><td>'+statusTag(b.status)+'</td><td>'+(b.status==='취소'?'<span class="small">-</span>':(b.status==='대기'?'<button class="btn" data-act="bstat" data-id="'+b.id+'" data-s="확정">확정</button> ':'')+'<button class="btn" data-act="bstat" data-id="'+b.id+'" data-s="취소">취소</button>')+'</td></tr>'}).join('')+'</tbody></table></div>';
  }
  if(S.tab==='rates'){
    var r=S.rate;
    h+='<div class="card"><b>1. 대상 수업 선택</b><div style="margin-top:8px;display:grid;gap:6px">'+classes().map(function(c){return '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-act="rsel" data-id="'+c.id+'" '+(r.sel[c.id]?'checked':'')+'> '+esc(c.name)+' <span class="meta">현재 '+fmt(c.price)+'</span></label>'}).join('')+'</div>'+
    '<b style="display:block;margin-top:16px">2. 변경 방식</b><div class="row" style="margin-top:8px"><select id="r-mode" aria-label="변경 방식" style="max-width:200px"><option value="pct"'+(r.mode==='pct'?' selected':'')+'>비율(%)로 변경</option><option value="won"'+(r.mode==='won'?' selected':'')+'>금액(원)으로 변경</option></select><input id="r-val" type="number" aria-label="변경 값" value="'+r.val+'" style="max-width:140px"><span class="meta">음수를 입력하면 인하됩니다</span></div></div>';
    var job=curJob(),rows=classes().filter(function(c){return r.sel[c.id]}).map(function(c){var np=calc(c.price);return {c:c,np:np}});
    h+='<h2 style="font-size:17px;margin-top:20px">3. 전송 전 미리보기</h2>';
    if(!rows.length)h+='<p class="meta">대상 수업을 한 개 이상 선택하세요.</p>';
    else h+='<div class="tablewrap"><table><thead><tr><th>수업</th><th class="num">변경 전</th><th class="num">변경 후</th><th>상태</th></tr></thead><tbody>'+rows.map(function(x){var st=job&&job.results[x.c.id];return '<tr><td>'+esc(x.c.name)+'</td><td class="num">'+fmt(x.c.price)+'</td><td class="num"><b>'+(x.np<1000?'<span class="tag bad">1,000원 미만</span>':fmt(x.np))+'</b></td><td>'+(st?(st==='ok'?'<span class="tag ok">반영 완료</span>':st==='fail'?'<span class="tag bad">전송 실패</span>':'<span class="tag warn">대기</span>'):'<span class="small">미적용</span>')+'</td></tr>'}).join('')+'</tbody></table></div>';
    var failed=job&&Object.keys(job.results).filter(function(k){return job.results[k]==='fail'}).length;
    h+='<div class="row"><button class="btn primary" data-act="rapply" '+((!rows.length||(job&&!failed)||rows.some(function(x){return x.np<1000}))?'disabled':'')+'>변경 적용</button>'+(failed?'<button class="btn" data-act="rretry">실패한 '+failed+'건만 다시 전송</button>':'')+(job&&!failed?'<span class="small">이미 적용된 변경입니다. 값을 바꾸면 다시 적용할 수 있습니다.</span>':'')+'</div>';
    h+='<div class="note">중복 실행 차단, 전송 전 미리보기, 실패 항목만 재전송하는 흐름을 보여주는 화면입니다. 실제 서비스에서는 각 단계(내부 저장, 외부 접수, 재조회 확인)를 항목별로 기록합니다.</div>';
  }
  if(S.tab==='sms'){
    var MS=messages();h+=MS.length?MS.map(function(m){return '<div class="sms" style="margin-bottom:10px">'+esc(m.body)+'</div>'}).join(''):'<p class="meta">아직 발송 기록이 없습니다. 고객 화면에서 예약을 완료하면 이곳에 쌓입니다.</p>';
  }
  return h
}
function calc(p){var r=S.rate,v=Number(r.val)||0;return Math.round(r.mode==='pct'?p*(1+v/100):p+v)}
function render(){
  $('#v-customer').setAttribute('aria-pressed',S.view==='customer');$('#v-admin').setAttribute('aria-pressed',S.view==='admin');
  $('#app').innerHTML=S.view==='customer'?customer():admin();
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t)return;var a=t.dataset.act;
  if(a==='rsel'){S.rate.sel[t.dataset.id]=t.checked;S.rate.jobId=null;render();return}
  if(a==='view'){S.view=t.dataset.v;render();return}
  if(a==='pickcls'){S.cls=t.dataset.id}
  else if(a==='pickdate'){S.date=t.dataset.k;S.slot=null}
  else if(a==='pickslot'){S.slot=t.dataset.s}
  else if(a==='pickpay'){S.pay=t.dataset.p}
  else if(a==='back'){S.step--;S.err=''}
  else if(a==='next'){
    if(S.step===3){
      if(S.name.trim().length<2){S.err='이름을 2자 이상 입력해 주세요.';render();return}
      if(!/^01[016789]-?\d{3,4}-?\d{4}$/.test(S.phone.trim())){S.err='휴대폰 번호 형식을 확인해 주세요. 예: 010-1234-5678';render();return}
    }
    S.err='';S.step++
  }
  else if(a==='pay'){
    var c=clsById(S.cls),when=shortDate(S.date)+' '+S.slot;
    var b=repo.create('bookings',{classId:c.id,customerName:S.name.trim(),phone:S.phone.trim(),parking:S.parking,date:S.date,slot:S.slot,amount:c.price,payMethod:S.pay==='naver'?'네이버페이':'카카오페이',status:'확정'},'R-',1046);
    S.last=b.id;
    repo.create('messages',{bookingId:b.id,body:'[플리에 스튜디오] '+b.customerName+'님, 예약이 확정되었습니다.\n수업: '+c.name+'\n일정: '+when+'\n예약번호: '+b.id+'\n수업 1시간 전에 알림을 한 번 더 보내드립니다.'},'M-',1);
    S.step=5;toast('결제가 완료되었습니다 (가상)')
  }
  else if(a==='again'){S.step=1;S.cls=S.date=S.slot=null;S.name=S.phone='';S.parking=false}
  else if(a==='tab'){S.tab=t.dataset.t}
  else if(a==='bstat'){repo.update('bookings',t.dataset.id,{status:t.dataset.s});toast('예약 상태를 '+t.dataset.s+'(으)로 바꿨습니다')}
  else if(a==='rapply'){
    var r=S.rate,res={},n=0;
    classes().forEach(function(c){if(r.sel[c.id]){n++;if(failOnce&&n===2){res[c.id]='fail'}else{res[c.id]='ok';repo.update('classes',c.id,{price:calc(c.price)})}}});
    failOnce=false;
    var jb=repo.create('rateJobs',{classIds:Object.keys(res),mode:r.mode,value:Number(r.val)||0,results:res,status:Object.keys(res).some(function(k){return res[k]==='fail'})?'partial':'done'},'J-',1);
    r.jobId=jb.id;toast(jb.status==='partial'?'일부 항목 전송에 실패했습니다':'모든 항목을 반영했습니다')
  }
  else if(a==='rretry'){
    var jb2=curJob(),res2=Object.assign({},jb2.results);
    Object.keys(res2).forEach(function(k){if(res2[k]==='fail'){res2[k]='ok';repo.update('classes',k,{price:calc(clsById(k).price)})}});
    repo.update('rateJobs',jb2.id,{results:res2,status:'done'});toast('실패한 항목만 다시 전송했습니다')
  }
  else return;
  render();
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='in-name')S.name=t.value;
  if(t.id==='in-phone')S.phone=t.value;
  if(t.id==='in-park')S.parking=t.checked;
  if(t.id==='r-mode'){S.rate.mode=t.value;S.rate.jobId=null;render()}
  if(t.id==='r-val'){S.rate.val=t.value;S.rate.jobId=null;var p=t.selectionStart;render();var n=$('#r-val');if(n){n.focus()}}
});
repo.init(COLS).then(function(){render();Repo.mountStatus(repo,COLS,function(){S.step=1;S.cls=S.date=S.slot=null;S.rate.jobId=null;render()})});
})();
