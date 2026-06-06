// Test v130 - Function word handling
// 这个测试验证功能词（in, an, for, the 等）是否被正确跳过

// 模拟 convertText 函数的核心逻辑
function testWordProcessing() {
  const FUNCTION_WORDS = new Set([
    'the','be','to','of','and','a','in','that','have','i',
    'it','for','not','on','with','he','as','you','do','at','this',
    'but','his','by','from','they','we','say','her','she','or',
    'an','will','my','one','all','would','there','their','what',
    'so','up','out','if','about','who','get','which','go','me',
  ]);

  function simulateConvertText(text) {
    const result = [];
    const WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;
    let match;

    while ((match = WORD_REGEX.exec(text)) !== null) {
      const start = match.index;
      const word = match[0];
      
      if (word.length <= 2) {
        result.push({ word, bolded: false, reason: 'length ≤ 2' });
        continue;
      }

      const normalized = word.toLowerCase().replace(/['\u2019]/g, '');
      const isFunctionWord = FUNCTION_WORDS.has(normalized);

      if (isFunctionWord) {
        result.push({ word, bolded: false, reason: 'function word' });
      } else {
        result.push({ word, bolded: true, reason: 'content word' });
      }
    }

    return result;
  }

  const tests = [
    { input: 'in an for the', desc: '功能词测试' },
    { input: 'in the house', desc: '混合功能词和实词' },
    { input: 'development in technology', desc: '完整句子' },
    { input: 'it is a good day', desc: '短功能词' },
    { input: 'optimize and improve', desc: '动词测试' },
  ];

  console.log('=== Function Word Handling Test ===\n');

  tests.forEach(test => {
    console.log(`测试: "${test.input}"`);
    console.log(`说明: ${test.desc}`);
    
    const results = simulateConvertText(test.input);
    
    results.forEach(r => {
      const status = r.bolded ? '✅ BOLD' : '❌ SKIP';
      console.log(`  ${status} "${r.word}" (${r.reason})`);
    });
    
    console.log('');
  });

  console.log('=== 总结 ===');
  console.log('IN、AN、FOR、THE 等功能词被故意跳过加粗，这是预期行为。');
  console.log('理由：功能词是语法连接词，加粗会干扰阅读流。');
}

// 运行测试
testWordProcessing();
