const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const store = new Map();
function boot() {
  const {window} = parseHTML(`<html><body><div class="yxtulcdsdk-review-fixed-content"><div><div>测试考试</div></div><section><header>单选题 共1小题</header><div class="pb24 ph32"><div><div class="w32">1.</div><span data-rich-text>测试题干</span><label>A. 甲<input type="radio" checked></label><label>B. 乙<input type="radio"></label><div id="feedback"></div></div></div></section></div><button id="submit">提交考试</button></body></html>`);
  let root, confirms=0;
  const attach=window.HTMLElement.prototype.attachShadow;
  window.HTMLElement.prototype.attachShadow=function(opts){root=attach.call(this,opts);return root;};
  window.HTMLElement.prototype.getClientRects=()=>[{}];
  window.HTMLElement.prototype.getBoundingClientRect=()=>({width:360,height:500,left:0,top:0});
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return [...this.options].find(o=>o.selected)?.value || this.options[0]?.value;},set(v){for(const o of this.options)o.selected=false; const chosen=[...this.options].find(o=>o.value===v); if(chosen)chosen.selected=true;},configurable:true});
  Object.defineProperty(window.HTMLSelectElement.prototype,'selectedOptions',{get(){return [...this.options].filter(o=>o.selected);},configurable:true});
  const inputs=window.document.querySelectorAll('input'); inputs[0].checked=true; inputs[1].checked=false;
  window.confirm=()=>{confirms++;return true;};
  const session=new Map();
  const context={window,document:window.document,location:{hash:'#/playinfo?projectid=test&taskId=exam'},
    URL,URLSearchParams,Blob,AbortController,console,innerWidth:1200,innerHeight:900,
    getComputedStyle:()=>({display:'block',visibility:'visible'}),
    sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v)},
    GM_getValue:(k,d)=>store.has(k)?structuredClone(store.get(k)):d,
    GM_setValue:(k,v)=>store.set(k,structuredClone(v)),GM_deleteValue:k=>store.delete(k),
    GM_xmlhttpRequest:()=>{throw Error('Unexpected network call');},
    setInterval:()=>1,clearInterval:()=>{},setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {window,root,confirms:()=>confirms};
}
const a=boot();
a.root.getElementById('snapshotBank').click();
let db=store.get('gcl-exam-bank-v1');
assert.equal(db.exams[0].attempts.length,1);
assert.equal(db.exams[0].attempts[0].entries[0].values[0],'A');
assert.equal(db.exams[0].evidence.length,0);
a.root.getElementById('reviewBank').click();
console.log('REVIEW:',a.root.getElementById('bankStatus').textContent);
assert.equal(a.root.getElementById('bankReview').children.length,1);
const select=a.root.querySelector('#bankReview select');
assert.equal(select.value,'unknown');
select.value='wrong';
a.root.getElementById('examOutcome').value='failed';
a.root.getElementById('confirmReview').click();
db=store.get('gcl-exam-bank-v1');
assert.equal(db.exams[0].evidence.length,1);
assert.equal(db.exams[0].evidence[0].verdict,'wrong');
assert.equal(db.exams[0].attempts[0].outcome,'failed');
assert(a.confirms()>=2);
const b=boot();
b.window.document.getElementById('submit').click(); // 原生用户提交动作的只读快照。
db=store.get('gcl-exam-bank-v1');
assert.equal(db.exams[0].attempts.length,2);
assert.equal(db.exams[0].evidence.length,1);
b.root.getElementById('reviewBank').click();
b.root.getElementById('examOutcome').value='passed';
b.root.getElementById('confirmReview').click();
console.log('SECOND:', b.root.getElementById('bankStatus').textContent);
db=store.get('gcl-exam-bank-v1');
assert.equal(db.exams[0].attempts[1].outcome,'passed');
assert.equal(db.exams[0].evidence.length,1); // 通过仍不应把未知题写成正确。
console.log('PASS: full userscript boot, confirmed snapshot/review, persistent reload, passive submit snapshot, passed-with-unknown handling');
async function testReuse() {
  db.exams[0].evidence.push({key:db.exams[0].evidence[0].key,answer:'["乙"]',verdict:'correct'});
  store.set('gcl-exam-bank-v1',db);
  const c=boot();
  c.root.getElementById('autoFill').checked=false;
  c.root.getElementById('webSearch').checked=false;
  c.root.getElementById('runApi').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(c.root.querySelector('#results .answer-value')?.textContent,'B');
  assert(c.root.getElementById('results').textContent.includes('本地题库：已核实答案'));
  const fresh=store.get('gcl-exam-bank-v1');
  assert.equal(fresh.exams[0].drafts[0].results[0].source,'confirmed-bank');
  console.log('PASS: confirmed bank answers reused without API key, no network, draft saved after confirmation');
}
testReuse().catch(error=>{console.error(error);process.exitCode=1;});
