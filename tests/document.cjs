const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const store = new Map();
let clock=100000;
function boot() {
  const {window} = parseHTML(`<html><body><div role="progressbar" aria-valuemax="100" aria-valuenow="87"></div><div class="yxtbiz-doc-player__toolbar"><div class="yxtbiz-doc-player__toolbar-item is-page"><div class="yxtbiz-doc-player__toolbar-page"><input value="22"><span>/</span>40</div></div><div id="next" class="yxtbiz-doc-player__toolbar-item"></div></div></body></html>`);
  let root, confirms=0, downloaded, tick;
  const attach=window.HTMLElement.prototype.attachShadow;
  window.HTMLElement.prototype.attachShadow=function(opts){root=attach.call(this,opts);return root;};
  window.HTMLElement.prototype.getClientRects=()=>[{}];
  window.HTMLElement.prototype.getBoundingClientRect=()=>({width:360,height:500,left:0,top:0});
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return [...this.options].find(o=>o.selected)?.value || this.options[0]?.value;},set(v){for(const o of this.options)o.selected=false; const chosen=[...this.options].find(o=>o.value===v); if(chosen)chosen.selected=true;},configurable:true});
  Object.defineProperty(window.HTMLSelectElement.prototype,'selectedOptions',{get(){return [...this.options].filter(o=>o.selected);},configurable:true});
  const inputs=window.document.querySelectorAll('input'); 
  window.confirm=()=>{confirms++;return true;};
  const session=new Map();
  const context={window,document:window.document,location:{hash:'#/doc/play?kngId=test'},
    URL: class extends URL {static createObjectURL(blob){downloaded=blob;return 'blob:test';} static revokeObjectURL(){}},URLSearchParams,Blob,TextEncoder,AbortController,console,Date: {now:()=>clock},innerWidth:1200,innerHeight:900,
    getComputedStyle:()=>({display:'block',visibility:'visible'}),
    sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v)},
    GM_getValue:(k,d)=>store.has(k)?structuredClone(store.get(k)):d,
    GM_setValue:(k,v)=>store.set(k,structuredClone(v)),GM_deleteValue:k=>store.delete(k),
    GM_xmlhttpRequest:opts=>{queueMicrotask(()=>opts.onload({status:200,responseText:JSON.stringify({choices:[{message:{content:JSON.stringify({answers:['B'],explanation:'模拟分析说明',uncertain:false})},finish_reason:'stop'}]})}));return {abort(){}};},
    setInterval:(fn,ms)=>{if(ms===1000)tick=fn;return 1;},clearInterval:()=>{},setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {window,root,confirms:()=>confirms,downloaded:()=>downloaded,tick:()=>tick()};
}


const a=boot(), d=a.window.document, r=a.root;
const next=d.getElementById('next'), input=d.querySelector('input');
let clicks=0; next.addEventListener('click',()=>{clicks++;input.value=String(Number(input.value)+1);});
a.tick();assert.match(r.getElementById('progressText').textContent,/22 \/ 40/);
r.getElementById('startLearning').click();a.tick();assert.equal(clicks,0);
clock+=90000;a.tick();assert.equal(clicks,1);assert.equal(input.value,'23');a.tick();
r.getElementById('pause').click();clock+=100000;r.getElementById('pause').click();a.tick();assert.equal(clicks,1);
r.getElementById('stopLearning').click();clock+=100000;a.tick();assert.equal(clicks,1);
r.getElementById('startLearning').click();next.replaceWith(next.cloneNode(true));clock+=90000;a.tick();clock+=11000;a.tick();assert.match(r.getElementById('learningStatus').textContent,/未按预期变化/);
input.value='40';r.getElementById('startLearning').click();clock+=90000;a.tick();assert.match(r.getElementById('learningStatus').textContent,/等待平台/);assert.equal(r.getElementById('notice').hidden,true);
d.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','100');a.tick();a.tick();a.tick();assert.equal(r.getElementById('notice').hidden,false);
console.log('PASS: document interval, confirmation, pause, stop, failure, last page and platform completion');
