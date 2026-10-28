const fs = require('node:fs');
const assert = require('node:assert/strict');
const src = fs.readFileSync('鑫知海-自动继续学习.user.js', 'utf8');
eval(src.slice(src.indexOf('    function bankQuestion('), src.indexOf('    function setupDeepSeek(')));
const a = bankQuestion('单选题 1. 测试题干\nA. 甲\nB. 乙\nC. 丙');
const b = bankQuestion('单选题 8. 测试题干\nA. 丙\nB. 甲\nC. 乙');
assert.equal(a.key, b.key);
assert.deepEqual(bankLabels(b, bankAnswer(a, ['A'])), ['B']);
assert.notEqual(a.key, bankQuestion('单选题 1. 测试题干变化\nA. 甲\nB. 乙\nC. 丙').key);
assert.notEqual(a.key, bankQuestion('单选题 1. 测试题干\nA. 新甲\nB. 乙\nC. 丙').key);
assert.equal(bankQuestion('单选题 1. 题目\nA. 甲\nB. 甲'), null);
assert.equal(bankAnswer(a, ['A', 'B']), null);
assert.equal(bankAnswer(a, ['Z']), null);
assert.equal(bankLabels(b, '["不存在的选项"]'), null);
const exam = { evidence: [] };
assert.equal(bankEvidence(exam, a).right, null);
exam.outcome = 'passed'; // 通过本身不产生任何逐题正确证据。
assert.equal(bankEvidence(exam, a).right, null);
exam.evidence.push({key: a.key, answer: bankAnswer(a, ['A']), verdict:'correct'});
assert.equal(bankEvidence(exam, b).right, bankAnswer(b, ['B']));
assert.equal(bankEvidence({evidence:[]}, b).right, null); // 分考试隔离。
exam.evidence.push({key:a.key, answer:bankAnswer(a,['A']), verdict:'wrong'});
assert.equal(bankEvidence(exam,a).conflict,true);
assert.equal(bankEvidence(exam,a).right,null);
const multi = bankQuestion('多选题 1. 测试组合\nA. 甲\nB. 乙\nC. 丙');
const wrong = bankAnswer(multi, ['A','B']);
assert.equal(wrong, bankAnswer(multi, ['B','A']));
assert.notEqual(wrong, bankAnswer(multi, ['A','C']));
assert.notEqual(wrong, bankAnswer(multi, ['A'])); // 组合错不等于选项本身错。
const judge = bankQuestion('判断题 3. 测试陈述\n正确\n错误');
assert.deepEqual(bankLabels(judge, bankAnswer(judge,['正确'])),['正确']);
assert(src.includes('if (memory.q && memory.wrong.includes(bankAnswer(memory.q, result.values)))'));
console.log('PASS: exam isolation, option reordering, content changes, invalid options, pass without proof, conflicts and wrong multi-answer combinations');
