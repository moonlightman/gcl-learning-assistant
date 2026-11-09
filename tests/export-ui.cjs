const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const store = new Map();
function boot() {
  const {window} = parseHTML(`<html><body><div class="yxtulcdsdk-review-fixed-content"><div><div>测试考试</div></div><section><header>单选题 共1小题</header><div class="pb24 ph32"><div><div class="w32">1.</div><span data-rich-text>测试题干</span><label>A. 甲<input type="radio" checked></label><label>B. 乙<input type="radio"></label><div id="feedback"></div></div></div></section></div><button id="submit">提交考试</button></body></html>`);
  let root, confirms=0, downloaded, tick;
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
    URL: class extends URL {static createObjectURL(blob){downloaded=blob;return 'blob:test';} static revokeObjectURL(){}},URLSearchParams,Blob,TextEncoder,AbortController,console,innerWidth:1200,innerHeight:900,
    getComputedStyle:()=>({display:'block',visibility:'visible'}),
    sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v)},
    GM_getValue:(k,d)=>store.has(k)?structuredClone(store.get(k)):d,
    GM_setValue:(k,v)=>store.set(k,structuredClone(v)),GM_deleteValue:k=>store.delete(k),
    GM_xmlhttpRequest:opts=>{queueMicrotask(()=>opts.onload({status:200,responseText:JSON.stringify({choices:[{message:{content:JSON.stringify({answers:['B'],explanation:'模拟分析说明',uncertain:false})},finish_reason:'stop'}]})}));return {abort(){}};},
    setInterval:(fn,ms)=>{if(ms===1000)tick=fn;return 1;},clearInterval:()=>{},setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {window,root,confirms:()=>confirms,downloaded:()=>downloaded,tick:()=>tick()};
}

(async()=>{
const a=boot();
assert.equal(a.root.getElementById('snapshotBank'),null);
a.root.getElementById('downloadQuestions').click();
assert(a.root.getElementById('exportStatus').textContent.includes('已下载 1 题'));
assert.equal(store.has('gcl-exam-bank-v1'),false);
const blob=a.downloaded(); assert(blob); assert.equal(blob.type,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
fs.writeFileSync(require('node:path').join(require('node:os').tmpdir(),'gcl-export-test.xlsx'),Buffer.from(await blob.arrayBuffer()));
const bytes=Buffer.from(await blob.arrayBuffer());
assert(bytes.includes(Buffer.from('测试题干')));assert(bytes.includes(Buffer.from('页面已选答案')));
assert(bytes.includes(Buffer.from('>A</t>')));
a.root.getElementById('apiKey').value='mock-test-key';
a.root.getElementById('webSearch').checked=false;
a.root.getElementById('autoFill').checked=false;
a.root.getElementById('runApi').click();
await new Promise(resolve=>setImmediate(resolve));
console.log('ANALYSIS STATUS',a.root.getElementById('searchStatus').textContent);assert.equal(a.root.querySelector('#results .answer-value')?.textContent,'B');
a.root.getElementById('downloadQuestions').click();
const analyzed=Buffer.from(await a.downloaded().arrayBuffer());
assert(analyzed.includes(Buffer.from('模拟分析说明')));
assert.equal(store.has('gcl-exam-bank-v1'),false);
const dialog=a.window.document.createElement('div');dialog.setAttribute('role','dialog');
dialog.innerHTML='提示 您已经打开过该课程，系统在同一时间同一课程只会记录一个播放页面的学习进度和学分，确认是否仍在此页面学习？<button>确定</button>';
let clicks=0;dialog.querySelector('button').addEventListener('click',()=>clicks++);a.window.document.body.append(dialog);
a.tick();a.tick();assert.equal(clicks,1);
dialog.remove();a.tick();a.window.document.body.append(dialog);a.tick();assert.equal(clicks,1);
assert(a.root.getElementById('status').textContent.includes('播放冲突再次出现'));
dialog.remove();a.tick();
dialog.textContent='是否删除资料？';const button=a.window.document.createElement('button');button.textContent='确定';dialog.append(button);button.addEventListener('click',()=>clicks++);a.window.document.body.append(dialog);a.tick();assert.equal(clicks,1);
console.log('PASS: latest full boot, XLSX download with selected answer, no bank persistence, duplicate-playback recovery, repeated-conflict guard, unrelated-dialog exclusion');
})().catch(e=>{console.error(e);process.exitCode=1;});
