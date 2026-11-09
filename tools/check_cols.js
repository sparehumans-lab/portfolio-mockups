const fs=require('fs'),vm=require('vm');
const root=process.argv[2];
const sql=fs.readFileSync(root+'/db/schema.sql','utf8');
const tables={};sql.replace(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g,(_,n,b)=>{tables[n]=b.split('\n').map(l=>l.trim().split(' ')[0]).filter(Boolean)});
const ctx={window:{},document:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/src/repo.js','utf8'),ctx);
let bad=0;
for(const ns of ['a','c','f']){
  const c2={};vm.createContext(c2);
  vm.runInContext(fs.readFileSync(root+'/src/'+ns+'-data.js','utf8')+';this.out={COLS,seed:seedData()}',c2);
  const R=vm.runInContext('Repo._map',ctx);
  for(const col of c2.out.COLS){
    const t=ns+'_'+R.snake(col);const cols=tables[t];
    if(!cols){console.log('NO TABLE',t);bad++;continue}
    const docs=c2.out.seed[col];
    for(const d of docs){for(const k of Object.keys(d)){const cn=R.colName(k);if(!cols.includes(cn)){console.log('MISSING',t,cn);bad++}}}
    console.log(t,'rows',docs.length,'ok');
  }
}
console.log(bad?'FAIL':'ALL MATCH');
