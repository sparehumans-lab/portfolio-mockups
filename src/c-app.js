
(function(){
var $=function(s){return document.querySelector(s)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(function(){t.hidden=true},2400)}
var TYPES=['가정집 입주 청소','사무실 정기 청소','상가 · 식당 청소','병원 · 학교 청소','공장 · 창고 청소'];
var AREAS=['서울 강남','서울 마포','경기 성남','경기 고양','인천 연수'];
var ROLES=[['cust','고객'],['biz','업체'],['work','작업자'],['admin','운영자']];
var ME_ID='u1',MY_CO='k3';
var repo=Repo.make(Repo.fromConfig('c'),seedData);
var S={role:'cust',form:{type:TYPES[0],area:AREAS[0],size:'',date:'',cap:3,note:'',err:''},jobForm:{title:'',area:AREAS[0],when:'',pay:'',need:2,err:''}};
function me(){return repo.get('users',ME_ID)}
function coName(id){var c=repo.get('companies',id);return c?c.name:'-'}
function joinsOf(qid){return repo.list('quoteJoins',function(x){return x.quoteId===qid})}
function appsOf(jid){return repo.list('applications',function(x){return x.jobId===jid})}
function userName(id){var u=repo.get('users',id);return u?u.name:'-'}
function tagOf(q){return q.status==='모집 중'?'ok':q.status==='마감'?'mute':q.status==='상담 중'?'info':'amber'}
function quoteCard(q,acts){
  var n=joinsOf(q.id).length;
  return '<div class="card"><div><span class="tag '+tagOf(q)+'">'+q.status+'</span><span class="meta">'+q.id+'</span></div>'+
  '<h3 style="margin-top:6px">'+esc(q.type)+'</h3><div class="meta">'+esc(q.area)+' · '+q.size+'평 · 희망 '+esc(q.date)+'</div>'+
  '<div class="meta" style="margin-top:4px">'+esc(q.note||'요청사항 없음')+'</div>'+
  '<div class="bar" aria-hidden="true"><i style="width:'+Math.min(100,n/q.cap*100)+'%"></i></div><div class="meta">참여 업체 '+n+' / '+q.cap+'</div>'+(acts||'')+'</div>'
}
function cust(){
  var f=S.form,h='<h2>견적 요청</h2><p class="sub">한 번 올리면 조건에 맞는 업체에 알림톡이 가고, 정해진 수의 업체만 참여해 상담합니다.</p>';
  h+='<div class="card"><label class="f" for="f-type">청소 종류</label><select id="f-type" data-k="type">'+TYPES.map(function(t){return '<option'+(t===f.type?' selected':'')+'>'+t+'</option>'}).join('')+'</select>'+
  '<label class="f" for="f-area">지역</label><select id="f-area" data-k="area">'+AREAS.map(function(t){return '<option'+(t===f.area?' selected':'')+'>'+t+'</option>'}).join('')+'</select>'+
  '<label class="f" for="f-size">면적 (평)</label><input id="f-size" data-k="size" type="number" min="1" value="'+esc(f.size)+'" placeholder="예: 30">'+
  '<label class="f" for="f-date">희망 일정</label><input id="f-date" data-k="date" type="text" value="'+esc(f.date)+'" placeholder="예: 11/20 오전">'+
  '<label class="f" for="f-cap">참여 업체 수 (정원)</label><select id="f-cap" data-k="cap">'+[1,2,3,4,5].map(function(n){return '<option'+(n==f.cap?' selected':'')+'>'+n+'</option>'}).join('')+'</select>'+
  '<label class="f" for="f-note">상세 조건</label><textarea id="f-note" data-k="note" placeholder="주차, 엘리베이터, 반려동물 등">'+esc(f.note)+'</textarea>'+
  '<p class="err" role="alert">'+esc(f.err)+'</p><div class="row" style="margin-top:0"><button class="btn primary" data-act="submitq">견적 요청 올리기</button></div></div>';
  var mine=repo.list('quotes',function(q){return q.requesterId===ME_ID}).map(function(q){
    var js=joinsOf(q.id);return quoteCard(q,'<ul class="tl">'+(js.length?js.map(function(j){return '<li>'+esc(coName(j.companyId))+' 업체가 참여했습니다 (연락처 공개됨)</li>'}).join(''):'<li>아직 참여한 업체가 없습니다</li>')+'</ul>')}).join('');
  h+='<div class="sec"><h2>내 견적 현황</h2><div class="grid">'+(mine||'<p class="meta">요청한 견적이 없습니다.</p>')+'</div></div>';
  return h
}
function biz(){
  var h='<h2>업체 모드: '+esc(coName(MY_CO))+'</h2><p class="sub">조건에 맞는 견적만 알림으로 받고, 정원이 차면 자동으로 마감됩니다. 고객 연락처는 참여한 업체에만 보입니다.</p><div class="grid">';
  h+=repo.list('quotes').map(function(q){
    var js=joinsOf(q.id),joined=js.some(function(x){return x.companyId===MY_CO}),full=js.length>=q.cap&&!joined;
    var act=joined?'<div class="row"><span class="tag ok">참여함</span><span class="meta">고객 연락: 010-****-1234 (가상)</span></div>':
      '<div class="row"><button class="btn primary" data-act="join" data-id="'+q.id+'" '+(full?'disabled':'')+'>'+(full?'정원 마감':'견적 참여하기')+'</button><span class="meta lock" aria-hidden="true">010-0000-0000</span></div>';
    return quoteCard(q,act)}).join('')+'</div>';
  h+='<div class="sec"><h2>작업자 모집 공고</h2><div class="card" style="max-width:520px"><label class="f" for="j-title">공고 제목</label><input id="j-title" data-j="title" type="text" value="'+esc(S.jobForm.title)+'" placeholder="예: 신축 현장 마감 청소">'+
  '<label class="f" for="j-when">작업 일시</label><input id="j-when" data-j="when" type="text" value="'+esc(S.jobForm.when)+'" placeholder="예: 11/18 08:00">'+
  '<label class="f" for="j-pay">보수</label><input id="j-pay" data-j="pay" type="text" value="'+esc(S.jobForm.pay)+'" placeholder="예: 일 14만원">'+
  '<label class="f" for="j-need">모집 인원</label><input id="j-need" data-j="need" type="number" min="1" value="'+S.jobForm.need+'">'+
  '<p class="err" role="alert">'+esc(S.jobForm.err)+'</p><div class="row" style="margin-top:0"><button class="btn primary" data-act="postjob">공고 올리기</button></div></div></div>';
  h+='<div class="sec"><h2>내 공고 지원자</h2>'+(repo.list('jobs',function(j){return j.companyId===MY_CO}).map(function(j){var ap=appsOf(j.id);return '<div class="card" style="margin-bottom:8px"><b>'+esc(j.title)+'</b> <span class="meta">'+esc(j.when)+' · '+esc(j.pay)+'</span><div class="meta">지원자 '+ap.length+'명'+(ap.length?': '+ap.map(function(a){return esc(userName(a.userId))}).join(', '):'')+'</div></div>'}).join('')||'<p class="meta">올린 공고가 없습니다.</p>')+'</div>';
  return h
}
function work(){
  var h='<h2>작업자 모드</h2><p class="sub">같은 계정으로 업체 대표이면서 다른 업체의 현장에도 나갈 수 있습니다. 활동 이력은 한 계정에 모이고 화면에서만 구분됩니다.</p>';
  h+='<div class="card" style="max-width:520px"><b>내 프로필</b><div class="meta" style="margin-top:4px">활동 지역 '+esc(me().area)+' · 가능 일정 '+esc(me().days)+' · 경력 '+me().career+'년</div></div>';
  h+='<div class="sec"><h2>구인 목록</h2><div class="grid">'+repo.list('jobs').map(function(j){
    var ap=appsOf(j.id).some(function(a){return a.userId===ME_ID}),own=j.companyId===MY_CO;
    return '<div class="card"><h3>'+esc(j.title)+'</h3><div class="meta">'+esc(coName(j.companyId))+' · '+esc(j.area)+'</div><div class="meta">'+esc(j.when)+' · '+esc(j.pay)+' · '+j.need+'명 모집</div>'+
    '<div class="row">'+(own?'<span class="meta">내 업체 공고입니다</span>':ap?'<span class="tag ok">지원 완료</span>':'<button class="btn primary" data-act="apply" data-id="'+j.id+'">지원하기</button>')+'</div></div>'}).join('')+'</div></div>';
  h+='<div class="note">직업정보제공사업 표시사항(신고번호 등)은 관리자가 입력하며 구인 목록 하단에 노출됩니다. 법 개정에 대비해 구인자 확인과 허위 구인 관리 기능을 나중에 붙일 수 있는 구조를 전제로 합니다.</div>';
  return h
}
function admin(){
  var h='<h2>운영자</h2><p class="sub">베타 기간에는 계약 결과와 업체 승인을 운영자가 전화 확인 후 직접 기록합니다.</p>';
  h+='<div class="tablewrap"><table><thead><tr><th>견적</th><th>유형 · 지역</th><th>참여</th><th>상태</th><th>계약 결과 기록</th></tr></thead><tbody>'+repo.list('quotes').map(function(q){
    return '<tr><td>'+q.id+'</td><td>'+esc(q.type)+'<div class="meta">'+esc(q.area)+'</div></td><td>'+joinsOf(q.id).length+' / '+q.cap+'</td><td><span class="tag '+tagOf(q)+'">'+q.status+'</span></td><td><select aria-label="'+q.id+' 계약 결과" data-act="result" data-id="'+q.id+'" style="max-width:190px">'+['','상담 진행','계약 완료','계약 불발','청소 완료'].map(function(o){return '<option value="'+o+'"'+(q.result===o?' selected':'')+'>'+(o||'결과 입력')+'</option>'}).join('')+'</select></td></tr>'}).join('')+'</tbody></table></div>';
  var QS=repo.list('quotes'),done=QS.filter(function(q){return q.result==='계약 완료'||q.result==='청소 완료'}).length;
  h+='<div class="note">계약 결과 기록 '+QS.filter(function(q){return q.result}).length+'건 · 계약 이상 '+done+'건. 이 데이터가 유료 전환 시점과 다음 개발 범위를 정하는 근거가 됩니다.</div>';
  var pend=repo.list('companies',function(c){return c.status==='대기'});
  h+='<div class="sec"><h2>업체 승인 대기</h2>'+(pend.length?pend.map(function(c){return '<div class="card" style="max-width:520px;margin-bottom:8px"><b>'+esc(c.name)+' (가상)</b><div class="meta">사업자등록증 업로드 완료 · 활동지역 '+esc(c.area)+'</div><div class="row"><button class="btn primary" data-act="approve" data-id="'+c.id+'">승인</button><button class="btn danger" data-act="reject" data-id="'+c.id+'">반려</button></div></div>'}).join(''):'<p class="meta">승인 대기 중인 업체가 없습니다.</p>')+'</div>';
  return h
}
function render(){
  $('#roles').innerHTML=ROLES.map(function(r){return '<button data-act="role" data-r="'+r[0]+'" aria-pressed="'+(S.role===r[0])+'">'+r[1]+'</button>'}).join('');
  $('#acct').innerHTML='로그인 계정 <b>'+esc(me().name)+'</b> (가상) · 보유 역할: 고객 · 업체 대표 · 작업자 <span class="meta">— 한 계정에서 역할만 바꿉니다</span>';
  $('#app').innerHTML={cust:cust,biz:biz,work:work,admin:admin}[S.role]();
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t||t.tagName==='SELECT')return;var a=t.dataset.act;
  if(a==='role'){S.role=t.dataset.r}
  else if(a==='submitq'){
    var f=S.form;
    if(!(Number(f.size)>0)){f.err='면적을 숫자로 입력해 주세요.';render();return}
    if(f.date.trim().length<2){f.err='희망 일정을 입력해 주세요.';render();return}
    repo.create('quotes',{type:f.type,area:f.area,size:Number(f.size),date:f.date.trim(),cap:Number(f.cap),note:f.note.trim(),requesterId:ME_ID,status:'모집 중',result:''},'Q-',204);
    S.form={type:TYPES[0],area:AREAS[0],size:'',date:'',cap:3,note:'',err:''};
    toast('견적이 등록되었습니다. 조건에 맞는 업체에 알림톡이 발송됩니다 (가상)')
  }
  else if(a==='join'){
    var q=repo.get('quotes',t.dataset.id),js=joinsOf(q.id);
    if(js.length<q.cap&&!js.some(function(x){return x.companyId===MY_CO})){repo.create('quoteJoins',{quoteId:q.id,companyId:MY_CO},'QJ-',5);if(js.length+1>=q.cap)repo.update('quotes',q.id,{status:'마감'});toast('견적에 참여했습니다. 고객에게 알림톡이 갑니다 (가상)')}
  }
  else if(a==='postjob'){
    var j=S.jobForm;
    if(j.title.trim().length<3){j.err='공고 제목을 3자 이상 입력해 주세요.';render();return}
    if(!j.when.trim()||!j.pay.trim()){j.err='작업 일시와 보수를 입력해 주세요.';render();return}
    repo.create('jobs',{title:j.title.trim(),area:j.area,when:j.when.trim(),pay:j.pay.trim(),need:Number(j.need)||1,companyId:MY_CO},'J-',33);
    S.jobForm={title:'',area:AREAS[0],when:'',pay:'',need:2,err:''};toast('구인 공고를 올렸습니다')
  }
  else if(a==='apply'){
    if(!appsOf(t.dataset.id).some(function(a){return a.userId===ME_ID}))repo.create('applications',{jobId:t.dataset.id,userId:ME_ID},'AP-',2);toast('지원했습니다. 업체에 알림톡이 갑니다 (가상)')
  }
  else if(a==='approve'){repo.update('companies',t.dataset.id,{status:'승인'});toast(coName(t.dataset.id)+' 업체를 승인했습니다')}
  else if(a==='reject'){repo.update('companies',t.dataset.id,{status:'반려'});toast('반려 처리했습니다. 실제 서비스에서는 사유 입력이 이어집니다 (데모)')}
  else return;
  render();
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.dataset.act==='result'){repo.update('quotes',t.dataset.id,{result:t.value});render();toast('계약 결과를 기록했습니다');return}
  if(t.dataset.k){S.form[t.dataset.k]=t.value}
  if(t.dataset.j){S.jobForm[t.dataset.j]=t.value}
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset.k&&t.tagName!=='SELECT')S.form[t.dataset.k]=t.value;
  if(t.dataset.j)S.jobForm[t.dataset.j]=t.value;
});
repo.init(COLS).then(function(){render();Repo.mountStatus(repo,COLS,render)});
})();
