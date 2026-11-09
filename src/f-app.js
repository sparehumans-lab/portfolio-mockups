(function(){
var $=function(s){return document.querySelector(s)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var won=function(n){return n.toLocaleString('ko-KR')+'원'};
var repo=Repo.make(Repo.fromConfig('f'),seedData);
var S={tab:'diag',filter:'all'};
function RATE(){return repo.get('settings','rate').value}
function findings(){return repo.list('findings')}
function rfpItems(){return repo.list('rfpItems').sort(function(a,b){return a.pos-b.pos})}
function criteria(){return repo.list('criteria').sort(function(a,b){return a.pos-b.pos})}
function vendors(){return repo.list('vendors')}
function diag(){
  var FS=findings(),list=FS.filter(function(f){return S.filter==='all'||f.sev===S.filter});
  var sel=FS.filter(function(f){return f.included}),md=sel.reduce(function(a,f){return a+f.manDays},0);
  var cnt={crit:0,high:0,mid:0,low:0};FS.forEach(function(f){cnt[f.sev]++});
  var h='<h2>1. 요약</h2><p>'+FS.length+'건의 문제를 위험도로 나눴습니다. 치명과 높음 항목은 출시 전에 먼저 고치는 것을 권합니다. 체크한 항목만 2단계 개선 견적에 포함됩니다.</p>';
  h+='<div class="chips" role="group" aria-label="위험도 필터"><button class="chip" data-act="f" data-v="all" aria-pressed="'+(S.filter==='all')+'">전체 '+FS.length+'</button>'+Object.keys(SEV).map(function(k){return '<button class="chip" data-act="f" data-v="'+k+'" aria-pressed="'+(S.filter===k)+'">'+SEV[k]+' '+cnt[k]+'</button>'}).join('')+'</div>';
  h+='<div class="sum" aria-live="polite"><div><b>'+sel.length+'건</b><span>개선 포함 항목</span></div><div><b>'+md+'인일</b><span>예상 공수</span></div><div><b>'+won(md*RATE())+'</b><span>개선 견적 (단가 '+won(RATE())+'/인일, VAT 별도)</span></div></div>';
  h+='<h2>2. 발견 사항</h2>';
  h+=list.map(function(f){return '<article class="finding"><header><span class="sev '+f.sev+'">'+SEV[f.sev]+'</span><span class="small">'+f.id+' · '+f.area+'</span><h3>'+esc(f.title)+'</h3></header><dl><dt>근거</dt><dd>'+esc(f.evidence)+'</dd><dt>조치안</dt><dd>'+esc(f.fix)+'</dd><dt>공수</dt><dd>'+f.manDays+'인일 · '+won(f.manDays*RATE())+'</dd></dl><label class="inc"><input type="checkbox" data-act="inc" data-id="'+f.id+'" '+(f.included?'checked':'')+'> 2단계 개선 견적에 포함</label></article>'}).join('');
  h+='<h2>3. 진단 방법</h2><p>소스 분석, 기능별 시험 시나리오 실행, 권한·결제 예외 상황 재현, 운영 설정 점검 순서로 진행합니다. 항목마다 재현 절차와 화면 또는 로그 근거를 첨부하고, 수정 후에는 같은 절차로 재검증한 결과를 별도 표로 남깁니다.</p>';
  return h
}
function rfp(){
  var RF=rfpItems(),n=RF.filter(function(x){return x.checked}).length,pct=Math.round(n/RF.length*100);
  var h='<h2>RFP 초안 검수 체크리스트</h2><p>발주 전에 제안요청서가 개발사를 비교할 수 있는 수준인지 확인하는 표입니다. 항목을 체크하면 완성도가 바뀝니다.</p>';
  h+='<div class="card" aria-live="polite"><b>완성도 '+pct+'%</b> <span class="small">('+n+' / '+RF.length+' 항목 충족)</span><div class="bar" style="margin-top:8px"><i style="width:'+pct+'%"></i></div></div>';
  h+='<div class="card" style="margin-top:12px">'+RF.map(function(r){return '<label class="check"><input type="checkbox" data-act="rfp" data-id="'+r.id+'" '+(r.checked?'checked':'')+'><span>'+esc(r.label)+'<small>'+esc(r.hint)+'</small></span></label>'}).join('')+'</div>';
  var miss=RF.filter(function(r){return !r.checked}).length;
  h+='<p style="margin-top:12px">'+(miss?'보완이 필요한 항목이 '+miss+'개 남았습니다. 특히 제외 범위와 평가 기준이 비어 있으면 개발사별 견적을 같은 기준으로 비교하기 어렵습니다.':'모든 항목이 채워졌습니다. 이 상태라면 개발사에 공고를 내도 좋습니다.')+'</p>';
  return h
}
function cmp(){
  var CR=criteria(),VD=vendors(),tot=0;CR.forEach(function(c){tot+=Number(c.weight)});
  var res=VD.map(function(v){var s=0;CR.forEach(function(c){s+=v.scores[c.id]*Number(c.weight)});return {v:v,sc:tot?s/tot:0}}).sort(function(a,b){return b.sc-a.sc});
  var prices=VD.map(function(v){return v.price}).sort(function(a,b){return a-b}),med=(prices[1]+prices[2])/2;
  var h='<h2>개발사 평가 가중치</h2><p>우리 프로젝트에서 무엇이 더 중요한지를 슬라이더로 정하면 순위가 다시 계산됩니다.</p><div class="card">'+CR.map(function(c){return '<div class="sl"><label for="w-'+c.id+'">'+c.label+'</label><input id="w-'+c.id+'" type="range" min="0" max="50" step="5" data-w="'+c.id+'" value="'+c.weight+'"><span class="small">'+c.weight+'</span></div>'}).join('')+'<div class="small">합계 '+tot+' (자동으로 100% 기준으로 환산합니다)</div></div>';
  h+='<h2>종합 순위</h2><div class="rank" aria-live="polite">'+res.map(function(r,i){return '<div class="r"><b>'+(i+1)+'</b><span>'+esc(r.v.name)+'</span><div class="bar"><i style="width:'+(r.sc/5*100)+'%"></i></div><span class="n" style="font-variant-numeric:tabular-nums">'+r.sc.toFixed(2)+'</span></div>'}).join('')+'</div>';
  h+='<h2>항목별 점수와 견적</h2><div class="tablewrap"><table><thead><tr><th>개발사</th>'+CR.map(function(c){return '<th class="n">'+c.label+'</th>'}).join('')+'<th class="n">견적(백만원)</th></tr></thead><tbody>'+VD.map(function(v){return '<tr><td>'+esc(v.name)+'</td>'+CR.map(function(c){return '<td class="n">'+v.scores[c.id]+'</td>'}).join('')+'<td class="n">'+v.price+'</td></tr>'}).join('')+'</tbody></table></div>';
  h+='<p class="small" style="margin-top:8px">견적 중앙값은 '+med+'백만원입니다. 중앙값보다 지나치게 낮은 견적은 범위 누락이나 인력 투입 부족을 먼저 의심해 확인 질문을 보냅니다. 점수는 1(낮음)에서 5(높음)입니다.</p>';
  return h
}
function render(){
  ['diag','rfp','cmp'].forEach(function(k){$('#t-'+k).setAttribute('aria-selected',S.tab===k)});
  $('#app').innerHTML={diag:diag,rfp:rfp,cmp:cmp}[S.tab]();
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-t],[data-act]');if(!t)return;
  if(t.dataset.t){S.tab=t.dataset.t;render();return}
  var a=t.dataset.act;
  if(a==='f'){S.filter=t.dataset.v;render()}
  else if(a==='inc'){repo.update('findings',t.dataset.id,{included:t.checked});render()}
  else if(a==='rfp'){repo.update('rfpItems',t.dataset.id,{checked:t.checked});render()}
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset.w){repo.update('criteria',t.dataset.w,{weight:Number(t.value)});var id=t.id;render();var n=document.getElementById(id);if(n)n.focus()}
});
repo.init(COLS).then(function(){render();Repo.mountStatus(repo,COLS,render)});
})();
