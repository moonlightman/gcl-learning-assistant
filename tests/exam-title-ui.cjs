const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const store = new Map();
function boot(onRequest) {
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
    GM_xmlhttpRequest:opts=>{if(onRequest)return onRequest(opts);queueMicrotask(()=>opts.onload({status:200,responseText:JSON.stringify({choices:[{message:{content:JSON.stringify({answers:['B'],explanation:'模拟分析说明',uncertain:false})},finish_reason:'stop'}]})}));return {abort(){}};},
    setInterval:(fn,ms)=>{if(ms===1000)tick=fn;return 1;},clearInterval:()=>{},setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {window,root,confirms:()=>confirms,downloaded:()=>downloaded,location:context.location,tick:()=>tick()};
}


(async()=>{
 const a=boot(),d=a.window.document,r=a.root;
 assert.equal(r.getElementById('examGroup').value,'测试考试');
 // The real platform uses the first nested child; late loading must update the field.
 d.querySelector('.yxtulcdsdk-review-fixed-content').firstElementChild.firstElementChild.textContent='安装工程课程测验';
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(r.getElementById('examGroup').value,'安装工程课程测验');
 r.getElementById('downloadQuestions').click();
 const bytes=Buffer.from(await a.downloaded().arrayBuffer());
 assert(bytes.includes(Buffer.from('安装工程课程测验')));
 // Input events establish a manual override that survives background title updates.
 const input=r.getElementById('examGroup');
 input.value='我的备注名称';input.dispatchEvent(new a.window.Event('input'));
 d.querySelector('.yxtulcdsdk-review-fixed-content').firstElementChild.firstElementChild.textContent='平台更新名称';
 a.tick();assert.equal(input.value,'我的备注名称');
 input.value='';input.dispatchEvent(new a.window.Event('input'));a.tick();assert.equal(input.value,'平台更新名称');
 input.value='旧页自定义';input.dispatchEvent(new a.window.Event('input'));
 a.location.hash='#/playinfo?projectid=test&taskId=new-exam';
 d.querySelector('.yxtulcdsdk-review-fixed-content').firstElementChild.innerHTML='<h2>设备管理考试</h2>';
 a.tick();assert.equal(input.value,'设备管理考试');
 // Question headings are excluded; meaningful document titles are a fallback.
 d.querySelector('.yxtulcdsdk-review-fixed-content').firstElementChild.innerHTML='<h2>单选题 共1小题</h2>';
 d.title='消防安全测验 - 鑫知海';a.tick();assert.equal(input.value,'消防安全测验');
 d.title='鑫知海';a.tick();assert.equal(input.value,'');assert.match(input.placeholder,/未识别/);
 // Full opacity is preserved for text; the slider changes background alpha only.
 r.getElementById('opacity').value='35';r.getElementById('opacity').dispatchEvent(new a.window.Event('input'));
 assert.equal(r.getElementById('card').style.opacity,'1');
 assert.equal(Number(r.getElementById('card').style.getPropertyValue('--surface-alpha')),0.72);
 r.getElementById('settingsTab').click();assert.equal(r.getElementById('homePage').hidden,true);
 r.getElementById('minimize').click();assert.equal(r.getElementById('card').classList.contains('mini'),true);
 r.getElementById('minimize').click();assert.equal(r.getElementById('card').classList.contains('mini'),false);
 console.log('PASS: live exam title, async DOM, export title, manual override, clear-to-auto, route change, semantic heading, fallback, unknown title, background opacity and UI toggles');

 a.window.__gclContinueLearning__.destroy();
 // A different exam title arriving during analysis must still block filling.
 let reply;
 const b=boot(opts=>{reply=opts;return {abort(){}};});
 b.root.getElementById('apiKey').value='mock-test-key';
 b.root.getElementById('webSearch').checked=false;
 b.root.getElementById('autoFill').checked=true;
 b.root.getElementById('runApi').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert(reply);
 const confirmsBeforeReply=b.confirms();
 b.window.document.querySelector('.yxtulcdsdk-review-fixed-content').firstElementChild.firstElementChild.textContent='另一场考试';
 reply.onload({status:200,responseText:JSON.stringify({choices:[{message:{content:JSON.stringify({answers:['B'],explanation:'mock',uncertain:false})},finish_reason:'stop'}]})});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(b.confirms(),confirmsBeforeReply);
 assert.match(b.root.getElementById('searchStatus').textContent,/考试名称已改变/);
 assert.equal(b.window.document.querySelectorAll('input')[1].checked,false);
 b.window.__gclContinueLearning__.destroy();
 console.log('PASS: a changed live exam title during analysis blocks answer filling');

})().catch(e=>{console.error(e);process.exitCode=1;});
