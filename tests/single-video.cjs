const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const store = new Map();
let clock=100000;
function boot() {
  const {window} = parseHTML(`<html><body><div role="progressbar" aria-valuemax="100" aria-valuenow="2"></div><button id="entry">继续学习</button></body></html>`);
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
  const context={window,document:window.document,location:{hash:'#/video/play?kngId=test'},
    URL: class extends URL {static createObjectURL(blob){downloaded=blob;return 'blob:test';} static revokeObjectURL(){}},URLSearchParams,Blob,TextEncoder,AbortController,console,Date: {now:()=>clock},innerWidth:1200,innerHeight:900,
    getComputedStyle:()=>({display:'block',visibility:'visible'}),
    sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v)},
    GM_getValue:(k,d)=>store.has(k)?structuredClone(store.get(k)):d,
    GM_setValue:(k,v)=>store.set(k,structuredClone(v)),GM_deleteValue:k=>store.delete(k),
    GM_xmlhttpRequest:opts=>{queueMicrotask(()=>opts.onload({status:200,responseText:JSON.stringify({choices:[{message:{content:JSON.stringify({answers:['B'],explanation:'模拟分析说明',uncertain:false})},finish_reason:'stop'}]})}));return {abort(){}};},
    setInterval:(fn,ms)=>{if(ms===1000)tick=fn;return 1;},clearInterval:()=>{},setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {window,root,confirms:()=>confirms,downloaded:()=>downloaded,location:context.location,tick:()=>tick()};
}



function addVideo(app, props={}) {
 const video=app.window.document.createElement('video');
 Object.assign(video,{paused:true,ended:false,error:null,play(){this.paused=false;return Promise.resolve();}},props);
 app.window.document.body.append(video);return video;
}
(async()=>{
 const a=boot(),d=a.window.document,r=a.root;let clicks=0;
 d.getElementById('entry').addEventListener('click',()=>{clicks++;d.getElementById('entry').remove();addVideo(a);});
 a.tick();assert.match(r.getElementById('progressText').textContent,/单视频.*2%/);
 r.getElementById('startLearning').click();a.tick();a.tick();assert.equal(clicks,1);assert.equal(d.querySelector('video').paused,false);
 assert.match(r.getElementById('learningStatus').textContent,/正在播放/);
 d.querySelector('video').paused=true;a.tick();assert.equal(d.querySelector('video').paused,true);assert.match(r.getElementById('learningStatus').textContent,/手动恢复/);
 d.querySelector('video').ended=true;a.tick();assert.equal(r.getElementById('notice').hidden,true);assert.match(r.getElementById('learningStatus').textContent,/等待平台完成/);
 const away=d.createElement('div');away.className='yxtf-dialog';away.setAttribute('role','dialog');away.innerHTML='已触发防挂机验证<button>继续学习</button>';d.body.append(away);
 let resumes=0;away.querySelector('button').addEventListener('click',()=>resumes++);a.tick();a.tick();assert.equal(resumes,1);assert.equal(clicks,1);away.remove();a.tick();assert.equal(r.getElementById('count').textContent,'1');
 const conflict=d.createElement('div');conflict.setAttribute('role','dialog');conflict.innerHTML='您已经打开过该课程，确认是否仍在此页面学习？<button>确定</button>';d.body.append(conflict);let takes=0;conflict.querySelector('button').addEventListener('click',()=>takes++);a.tick();a.tick();assert.equal(takes,1);conflict.remove();a.tick();d.body.append(conflict);a.tick();assert.equal(takes,1);assert.match(r.getElementById('status').textContent,/再次出现/);conflict.remove();
 d.querySelector('[role="progressbar"]').remove();const done=d.createElement('span');done.textContent='已完成学习';d.body.append(done);a.tick();a.tick();assert.equal(r.getElementById('notice').hidden,true);a.tick();assert.equal(r.getElementById('notice').hidden,false);
 // Route change clears completion state and does not start another course automatically.
 a.location.hash='#/video/play?kngId=other';done.remove();a.tick();assert.equal(r.getElementById('notice').hidden,true);assert.equal(r.getElementById('startLearning').disabled,false);
 const b=boot();let attempts=0;b.window.document.getElementById('entry').remove();addVideo(b,{play(){attempts++;return Promise.reject(Error('blocked'));}});b.root.getElementById('startLearning').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(attempts,1);assert.match(b.root.getElementById('learningStatus').textContent,/未允许播放/);b.tick();assert.equal(attempts,1);
 const c=boot();let starts=0;c.window.document.getElementById('entry').addEventListener('click',()=>starts++);c.root.getElementById('startLearning').click();c.tick();assert.equal(starts,1);clock+=21000;c.tick();assert.match(c.root.getElementById('learningStatus').textContent,/未能唯一识别或加载/);
 const e=boot();e.window.document.getElementById('entry').remove();const v=addVideo(e);e.root.getElementById('startLearning').click();e.root.getElementById('pause').click();assert.equal(e.root.getElementById('pause').textContent,'继续');e.root.getElementById('pause').click();e.root.getElementById('stopLearning').click();v.paused=true;e.tick();assert.equal(v.paused,true);
 const f=boot();addVideo(f);addVideo(f);f.root.getElementById('startLearning').click();assert.match(f.root.getElementById('learningStatus').textContent,/多个播放器/);
 const g=boot();g.window.document.querySelector('[role="progressbar"]').removeAttribute('aria-valuenow');g.tick();assert.match(g.root.getElementById('progressText').textContent,/待确认/);assert.equal(g.root.getElementById('notice').hidden,true);
 const h=boot();h.location.hash='#/video/play';h.tick();h.root.getElementById('startLearning').click();assert.match(h.root.getElementById('learningStatus').textContent,/请先打开/);
 console.log('PASS: standalone video route, one-shot entry/play, user pause, ended != completed, absence/multi-device prompts, explicit completion, route reset, autoplay rejection, load timeout, stop, ambiguous video and unknown progress');
})().catch(e=>{console.error(e);process.exitCode=1;});
