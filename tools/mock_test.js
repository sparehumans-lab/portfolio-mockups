// PostgREST 흉내 서버(Playwright route)로 Supabase 어댑터 경로를 검증
const {chromium}=require('playwright');
(async()=>{
 const store={};const b=await chromium.launch();const p=await b.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.APP_CONFIG={url:'https://mock.supabase.co',anonKey:'k'}});
 await p.route('https://mock.supabase.co/rest/v1/**',async r=>{
  const u=new URL(r.request().url());const t=u.pathname.split('/').pop();const m=r.request().method();
  const h={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  if(m==='OPTIONS')return r.fulfill({status:204,headers:h});
  store[t]=store[t]||{};
  if(m==='GET')return r.fulfill({status:200,headers:h,contentType:'application/json',body:JSON.stringify(Object.values(store[t]))});
  if(m==='POST'){const row=JSON.parse(r.request().postData());store[t][row.id]=row;return r.fulfill({status:201,headers:h,body:''})}
  if(m==='DELETE'){const f=u.searchParams.get('id');if(f==='not.is.null')store[t]={};else delete store[t][f.replace('eq.','')];return r.fulfill({status:204,headers:h})}
  r.fulfill({status:400,headers:h});
 });
 const open=async f=>{await p.goto('file://'+process.argv[2]+'/_mock/'+f);await p.waitForTimeout(500)};
 await open('a-booking.html');
 console.log('seeded tables:',Object.keys(store).length,'bookings:',Object.keys(store.a_bookings||{}).length);
 await p.click('[data-act=pickcls]');await p.click('[data-act=next]');await p.click('[data-act=pickdate]');
 await p.locator('[data-act=pickslot]:not([disabled])').first().click();await p.click('[data-act=next]');
 await p.fill('#in-name','테스트');await p.fill('#in-phone','010-1234-5678');await p.click('[data-act=next]');await p.click('[data-act=pay]');
 await p.waitForTimeout(300);
 const rows=Object.values(store.a_bookings);const nb=rows.find(r=>r.customer_name==='테스트');
 console.log('new booking row:',JSON.stringify(nb));
 console.log('status bar:',await p.locator('[role=status]').first().textContent());
 // reload -> data persists from "DB"
 await open('a-booking.html');await p.click('[data-act=view][data-v=admin]');
 console.log('rows after reload:',await p.locator('tbody tr').count());
 await p.getByText('데이터 초기화').click();await p.waitForTimeout(500);
 console.log('after reset bookings in store:',Object.keys(store.a_bookings).length);
 await open('c-matching.html');await p.fill('#f-size','40');await p.fill('#f-date','11/20');await p.click('[data-act=submitq]');await p.waitForTimeout(300);
 console.log('c quote row:',JSON.stringify(Object.values(store.c_quotes).find(r=>r.size===40)));
 await p.click('[data-act=role][data-r=biz]');await p.fill('#j-title','신축 현장 청소');await p.fill('#j-when','11/18');await p.fill('#j-pay','일 14만원');await p.click('[data-act=postjob]');await p.waitForTimeout(300);
 console.log('c job row:',JSON.stringify(Object.values(store.c_jobs).find(r=>r.title==='신축 현장 청소')));
 await open('f-samples.html');await p.locator('[data-act=inc]').nth(4).check();await p.waitForTimeout(300);
 console.log('f finding F-05 included:',store.f_findings['F-05'].included, 'man_days',store.f_findings['F-05'].man_days);
 console.log('errors:',errs);await b.close()})();
