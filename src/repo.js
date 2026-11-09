/* ===== repo.js — 데이터 계층 (UI와 분리) =====
 * 화면 코드는 Repo 의 list/get/create/update/remove 만 호출합니다.
 * 저장소는 adapter 로 교체합니다.
 *   memory   : 가상 데이터(새로고침하면 초기화). DB 설정이 없거나 연결 실패 시 자동 폴백
 *   supabase : Supabase REST(PostgREST). config.json 의 url/anonKey 가 있을 때 사용
 * adapter 규약: load(col)->Promise<doc[]>, save(col,id,doc), drop(col,id), clear(col)
 */
var Repo=(function(){
  var COLMAP={when:'when_at'};            /* SQL 예약어 회피: JS 필드 -> DB 컬럼 */
  var COLREV={when_at:'when'};
  function snake(k){return k.replace(/[A-Z]/g,function(m){return '_'+m.toLowerCase()})}
  function camel(k){return k.replace(/_([a-z])/g,function(_,c){return c.toUpperCase()})}
  function colName(k){return COLMAP[k]||snake(k)}
  function fieldName(c){return COLREV[c]||camel(c)}

  function memoryAdapter(){
    var mem={};
    return {name:'memory',
      load:function(col){return Promise.resolve((mem[col]||[]).slice())},
      save:function(col,id,doc){(mem[col]=mem[col]||[]);var i=mem[col].findIndex(function(d){return d.id===id});if(i<0)mem[col].push(doc);else mem[col][i]=doc;return Promise.resolve()},
      drop:function(col,id){mem[col]=(mem[col]||[]).filter(function(d){return d.id!==id});return Promise.resolve()},
      clear:function(col){mem[col]=[];return Promise.resolve()}};
  }

  function supabaseAdapter(cfg,ns){
    var base=String(cfg.url).replace(/\/$/,'')+'/rest/v1/';
    var H={apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey,'Content-Type':'application/json'};
    function tbl(col){return ns+'_'+snake(col)}
    function toRow(doc){var r={};Object.keys(doc).forEach(function(k){r[colName(k)]=doc[k]});return r}
    function fromRow(row){var d={};Object.keys(row).forEach(function(c){d[fieldName(c)]=row[c]});return d}
    function check(res){if(!res.ok)return res.text().then(function(t){throw new Error('HTTP '+res.status+' '+t.slice(0,200))});return res}
    function ctl(){var c=new AbortController();setTimeout(function(){c.abort()},10000);return c.signal}
    return {name:'supabase',
      load:function(col){return fetch(base+tbl(col)+'?select=*&limit=1000',{headers:H,signal:ctl()}).then(check).then(function(r){return r.json()}).then(function(rows){return rows.map(fromRow)})},
      save:function(col,id,doc){return fetch(base+tbl(col)+'?on_conflict=id',{method:'POST',headers:Object.assign({Prefer:'resolution=merge-duplicates,return=minimal'},H),body:JSON.stringify(toRow(doc)),signal:ctl()}).then(check)},
      drop:function(col,id){return fetch(base+tbl(col)+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:H,signal:ctl()}).then(check)},
      clear:function(col){return fetch(base+tbl(col)+'?id=not.is.null',{method:'DELETE',headers:H,signal:ctl()}).then(check)}};
  }

  /* 설정(config.json -> window.APP_CONFIG)이 있으면 Supabase, 없으면 메모리 */
  function fromConfig(ns){
    var c=(typeof window!=='undefined'&&window.APP_CONFIG)||{};
    if(c.url&&c.anonKey&&String(c.url).indexOf('YOUR-')<0)return supabaseAdapter(c,ns);
    return memoryAdapter();
  }

  function make(adapter,seed){
    var cache={},seq={},q=Promise.resolve(),fails=0;
    function now(){return new Date().toISOString()}
    function persist(fn){q=q.then(fn).catch(function(e){fails++;console.warn('persist failed',e);if(api.onError)api.onError(e)});return q} /* 쓰기를 순서대로 */
    function nextId(col,prefix,start){seq[col]=Math.max(seq[col]||start,start);
      var max=(cache[col]||[]).reduce(function(m,d){var n=parseInt(String(d.id).replace(/\D/g,''),10);return n>m?n:m},0);
      if(max>=seq[col])seq[col]=max+1;
      var id=prefix+(seq[col]++);
      if(adapter.name==='supabase')id+='-'+Math.random().toString(36).slice(2,6); /* 동시 방문자 충돌 방지 */
      return id}
    function seedAll(){
      var s=seed();return Promise.all(Object.keys(s).map(function(col){
        cache[col]=s[col].map(function(d){return Object.assign({createdAt:now(),updatedAt:now()},d)});
        return Promise.all(cache[col].map(function(d){return adapter.save(col,d.id,d)}))}))}
    var api={
      mode:adapter.name,onError:null,
      init:function(cols){
        return Promise.all(cols.map(function(col){return adapter.load(col).then(function(rows){cache[col]=rows})}))
        .then(function(){var empty=cols.every(function(c){return !cache[c].length});if(empty&&seed)return seedAll()})
        .catch(function(e){ /* DB 연결 실패 -> 메모리로 폴백 */
          if(adapter.name==='memory')throw e;
          console.warn('DB 연결 실패, 메모리 모드로 전환',e);
          adapter=memoryAdapter();api.mode='memory';api.fallback=String(e.message||e);cache={};
          return api.init(cols)});
      },
      /* 모든 컬렉션을 비우고 시드를 다시 넣습니다 */
      reset:function(cols){
        return q.then(function(){return Promise.all(cols.map(function(c){return adapter.clear(c)}))}).then(function(){cache={};return seedAll()});
      },
      list:function(col,filter){var r=(cache[col]||[]);return (filter?r.filter(filter):r).slice()},
      get:function(col,id){return (cache[col]||[]).filter(function(d){return d.id===id})[0]||null},
      create:function(col,doc,prefix,start){var d=Object.assign({},doc);d.id=d.id||nextId(col,prefix||col[0]+'-',start||1);d.createdAt=d.updatedAt=now();(cache[col]=cache[col]||[]).push(d);persist(function(){return adapter.save(col,d.id,d)});return d},
      update:function(col,id,patch){var d=api.get(col,id);if(!d)return null;Object.assign(d,patch,{updatedAt:now()});persist(function(){return adapter.save(col,id,d)});return d},
      remove:function(col,id){cache[col]=(cache[col]||[]).filter(function(d){return d.id!==id});persist(function(){return adapter.drop(col,id)})}
    };
    return api;
  }

  /* 화면 하단의 저장소 상태 표시줄 + 데이터 초기화 버튼 */
  function mountStatus(repo,cols,rerender){
    var bar=document.createElement('div');
    bar.setAttribute('role','status');
    bar.style.cssText='margin:24px auto 0;padding:10px max(16px,env(safe-area-inset-left,0px));display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;font-size:12px;color:var(--muted,#666);border-top:1px solid var(--line,#ddd)';
    var txt=document.createElement('span');
    var ver=(typeof window!=='undefined'&&window.APP_VERSION)?' · '+window.APP_VERSION:'';
    txt.textContent=(repo.mode==='supabase'?'저장소: Supabase DB 연결됨 (방문자 공용 데이터)':'저장소: 브라우저 메모리 (가상 데이터, 새로고침하면 초기화)'+(repo.fallback?' · DB 연결 실패로 전환됨':''))+ver;
    var b=document.createElement('button');b.type='button';b.textContent='데이터 초기화';
    b.style.cssText='font:inherit;padding:4px 10px;border:1px solid var(--line,#ccc);border-radius:6px;background:var(--surface,transparent);color:var(--fg,inherit);cursor:pointer';
    b.onclick=function(){b.disabled=true;b.textContent='초기화 중…';repo.reset(cols).then(function(){b.disabled=false;b.textContent='데이터 초기화';rerender()}).catch(function(e){b.disabled=false;b.textContent='초기화 실패';console.warn(e)})};
    bar.appendChild(txt);bar.appendChild(b);document.body.appendChild(bar);
  }
  return {memoryAdapter:memoryAdapter,supabaseAdapter:supabaseAdapter,fromConfig:fromConfig,make:make,mountStatus:mountStatus,_map:{colName:colName,fieldName:fieldName,snake:snake}};
})();
