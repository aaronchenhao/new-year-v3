// 模拟constants.ts中的内容
const SENSITIVE_WORDS = [
  // 脏话
  "死", "滚", "傻逼", "弱智", "垃圾", "废物", "尼玛", "操", "干", "日", "杀", "tmd", "nmd", "sb",
  "操你", "fuck", "shit", "bitch", "damn", "hell", "asshole", "dick", "pussy", "cunt",
  "混蛋", "王八蛋", "狗屎", "狗屁", "贱人", "婊子", "嫖客", "妓女", "鸡巴", "阴茎",
  "阴道", "乳房", "屁股", "屎", "尿", "痰", "精液", "月经", "堕胎", "毒品",
  // 违禁词
  "共产党", "毛泽东", "天安门", "法轮功", "台独", "港独", "疆独", "藏独", "六四"
];

// 敏感词过滤函数
const filterSensitiveWords = (text) => {
  if (!text) return text;
  
  let filteredText = text;
  
  // 遍历所有敏感词
  for (const word of SENSITIVE_WORDS) {
    if (word) {
      // 创建正则表达式，支持大小写不敏感
      const regex = new RegExp(word, 'gi');
      
      // 替换敏感词为*号，保持长度一致
      filteredText = filteredText.replace(regex, (match) => {
        return '*'.repeat(match.length);
      });
    }
  }
  
  return filteredText;
};

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
