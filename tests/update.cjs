const fs=require('node:fs'), assert=require('node:assert/strict');
const src=fs.readFileSync('鑫知海-自动继续学习.user.js','utf8');
const code=src.slice(src.indexOf('    function setupUpdater()'),src.indexOf('    function setupPanel()'));
const nodes={checkUpdate:{addEventListener(type,fn){this.click=fn;}},installUpdate:{hidden:true},updateStatus:{}};
const $=id=>nodes[id],write=(id,text)=>nodes[id].textContent=text;
const events=new AbortController();let pending;
const GM_xmlhttpRequest=opts=>{pending=opts;return {abort(){opts.onabort();}};};
eval(code);
const dispose=setupUpdater();
function version(v){nodes.checkUpdate.click();pending.onload({status:200,responseText:`// ==UserScript==\n// @version ${v}\n// ==/UserScript==`});}
version('4.10');assert.equal(nodes.installUpdate.hidden,false);
assert(nodes.installUpdate.href.startsWith('https://raw.githubusercontent.com/moonlightman/'));
version('4.9');assert.equal(nodes.installUpdate.hidden,true);
version('4.8');assert.equal(nodes.installUpdate.hidden,true);
nodes.checkUpdate.click();pending.ontimeout();assert(nodes.updateStatus.textContent.includes('超时'));
nodes.checkUpdate.click();pending.onload({status:404});assert(nodes.updateStatus.textContent.includes('404'));
nodes.checkUpdate.click();pending.onload({status:200,responseText:'<html>error</html>'});assert.equal(nodes.installUpdate.hidden,true);
nodes.checkUpdate.click();dispose();assert.equal(nodes.installUpdate.hidden,true);
console.log('PASS: update version comparison, fixed installation URL, malformed metadata, timeout, HTTP errors and cleanup');
