import { filterSensitiveWords, SENSITIVE_WORDS } from './constants';

// 测试用例
const testCases = [
  '你好，傻逼',
  '操你妈',
  '我是废物',
  'fuck you',
  'shit happens',
  '共产党',
  '毛泽东',
  '天安门',
  '法轮功',
  '台独',
  '正常内容测试',
  '混合内容测试：傻逼，操你，fuck',
];

console.log('=== 敏感词过滤测试 ===');
console.log('敏感词列表:', SENSITIVE_WORDS);
console.log('');

testCases.forEach((testCase, index) => {
  const result = filterSensitiveWords(testCase);
  console.log(`测试 ${index + 1}:`);
  console.log(`输入: ${testCase}`);
  console.log(`输出: ${result}`);
  console.log(`是否有变化: ${testCase !== result}`);
  console.log('');
});

console.log('=== 测试完成 ===');
