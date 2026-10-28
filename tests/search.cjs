const fs = require('fs');
const assert = require('assert/strict');
const src = fs.readFileSync('鑫知海-自动继续学习.user.js', 'utf8');
const requestCode = src.slice(src.indexOf('        function request(cfg,'), src.indexOf('        async function requestWithRetry'));
const decodeCode = src.slice(src.indexOf('        function decodeAnswer('), src.indexOf('        function renderAnswer('));
let cancelRequest, lastRequest, nextResponse;
const GM_xmlhttpRequest = opts => {
    lastRequest = opts;
    if (nextResponse) queueMicrotask(() => opts.onload(nextResponse));
    return { abort() {} };
};
eval(requestCode + '\n' + decodeCode);
const cfg = { model: 'test', endpoint: 'https://api.deepseek.com/chat/completions', key: 'mock-key', extra: {} };
const question = '单选题 1. 这是测试题\nA. 甲\nB. 乙';
(async () => {
    nextResponse = { status: 200, responseText: JSON.stringify({ results: [
        {title: '测试来源', url: 'https://example.com/test', summary: '测试摘要'},
        {title: '危险链接', url: 'javascript:alert(1)'}
    ]}) };
    const sources = await request(cfg, question, [], true);
    assert.equal(sources.length, 1);
    assert.equal(lastRequest.url, 'https://api.deepseek.com/v1/tools/search');
    assert.deepEqual(JSON.parse(lastRequest.data), {query: '这是测试题', count: 5, need_content: false});
    nextResponse = {status: 200, responseText: JSON.stringify({choices:[{message:{content: JSON.stringify({answers:['A'], explanation:'测试依据[1]', uncertain:false})}, finish_reason:'stop'}]})};
    const answer = await request(cfg, question, sources);
    const payload = JSON.parse(lastRequest.data);
    assert.equal(payload.messages.length, 3);
    assert(payload.messages[2].content.includes('https://example.com/test'));
    answer.sources = sources; answer.searched = true;
    const decoded = decodeAnswer(question, answer);
    assert.equal(decoded.valid, true);
    assert.equal(decoded.sources.length, 1);
    await request(cfg, question);
    assert.equal(JSON.parse(lastRequest.data).messages.length, 2);
    nextResponse = {status: 401};
    await assert.rejects(request(cfg, question, [], true), /联网检索 HTTP 401/);
    nextResponse = {status:200, responseText:'{"results":[]}'};
    assert.deepEqual(await request(cfg, question, [], true), []);
    nextResponse = {status:200, responseText:'{}'};
    await assert.rejects(request(cfg, question, [], true), /搜索接口响应格式/);
    nextResponse = null;
    const pending = request(cfg, question, [], true);
    cancelRequest();
    await assert.rejects(pending, /已停止/);
    console.log('PASS: search payload, source filtering, model context, answer decoding, offline mode, errors, empty results, cancellation');
})().catch(error => { console.error(error); process.exitCode = 1; });
