/**
 * Verify the new text-vide interpolation algorithm.
 * Tests: boundary table accuracy, ratio mapping, invariant (never bold entire word).
 */

const FB = [
  [0, 4, 12, 17, 24, 29, 35, 42, 48],
  [1, 2, 7, 10, 13, 14, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49],
  [1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49],
  [0, 2, 4, 5, 6, 8, 9, 11, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48],
  [0, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 17, 19, 20, 21, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48],
];

function calcBold(wordLen, table) {
  const idx = table.findIndex(b => wordLen <= b);
  if (idx === -1) return wordLen - table.length;
  return wordLen - idx;
}

function getBoldLength(wordLen, boldRatio) {
  if (wordLen <= 1) return 0;
  const fp = 1 + (0.9 - boldRatio) / 0.8 * 4;
  const lowerIdx = Math.max(0, Math.min(4, Math.floor(fp) - 1));
  const upperIdx = Math.max(0, Math.min(4, Math.ceil(fp) - 1));
  const t = fp - Math.floor(fp);
  const boldLower = calcBold(wordLen, FB[lowerIdx]);
  const boldUpper = calcBold(wordLen, FB[upperIdx]);
  let boldLen;
  if (lowerIdx === upperIdx) {
    boldLen = boldLower;
  } else {
    boldLen = Math.round(boldLower + t * (boldUpper - boldLower));
  }
  return Math.max(0, Math.min(boldLen, wordLen - 1));
}

function boldWord(word, boldRatio) {
  const b = getBoldLength(word.length, boldRatio);
  if (b <= 0 || b >= word.length) return word;
  return '**' + word.slice(0, b) + '**' + word.slice(b);
}

// ── Test 1: Verify against text-vide HOW.md examples (fixationPoint=1, ratio=0.9) ──
console.log('\n=== Test 1: text-vide HOW.md verification (fp=1, ratio=0.9) ===');
const howExamples = [
  { word: 'test-vide', parts: [{ w: 'test', bold: 3 }, { w: 'vide', bold: 3 }] },
  { word: 'apple', bold: 3 },  // length 5, unbold 2 → bold 3
  { word: 'reading', bold: 6 }, // length 8 (no, 7?), let's check
];

// Direct table 0 test
console.log('Word "test" (4):', calcBold(4, FB[0]), '→ bold 3:', 4-1);
console.log('Word "vide" (4):', calcBold(4, FB[0]), '→ bold 3:', 4-1);
console.log('Word "apple" (5):', calcBold(5, FB[0]), 'expected 3');
console.log('Word "reading" (7):', calcBold(7, FB[0]), 'expected 5 (7-2)');
console.log('Word "comprehensive" (13):', calcBold(13, FB[0]), 'expected 10 (13-3)');
console.log('Word length 10:', calcBold(10, FB[0]), 'expected 8 (10-2, per HOW.md)');

// ── Test 2: Verify ratio=0.9 matches table 0 exactly ──
console.log('\n=== Test 2: ratio 0.9 must match fixationPoint=1 exactly ===');
const words = ['cat', 'hello', 'reading', 'comprehensive', 'internationalization'];
words.forEach(w => {
  const fromTable = calcBold(w.length, FB[0]);
  const fromAlgo = getBoldLength(w.length, 0.9);
  const match = fromTable === fromAlgo ? 'OK' : 'FAIL';
  console.log(`${match}: "${w}" (${w.length}) table=${fromTable} algo=${fromAlgo}`);
});

// ── Test 3: Verify ratio=0.1 matches table 4 exactly ──
console.log('\n=== Test 3: ratio 0.1 must match fixationPoint=5 exactly ===');
words.forEach(w => {
  const fromTable = calcBold(w.length, FB[4]);
  const fromAlgo = getBoldLength(w.length, 0.1);
  const match = fromTable === fromAlgo ? 'OK' : 'FAIL';
  console.log(`${match}: "${w}" (${w.length}) table=${fromTable} algo=${fromAlgo}`);
});

// ── Test 4: Verify ratio=0.5 matches table 2 exactly ──
console.log('\n=== Test 4: ratio 0.5 must match fixationPoint=3 exactly ===');
words.forEach(w => {
  const fromTable = calcBold(w.length, FB[2]);
  const fromAlgo = getBoldLength(w.length, 0.5);
  const match = fromTable === fromAlgo ? 'OK' : 'FAIL';
  console.log(`${match}: "${w}" (${w.length}) table=${fromTable} algo=${fromAlgo}`);
});

// ── Test 5: Invariant — never bold entire word ──
console.log('\n=== Test 5: Invariant — never bold entire word (all lengths 1-60, all ratios) ===');
let failCount = 0;
for (let len = 1; len <= 60; len++) {
  for (let ratio = 10; ratio <= 90; ratio += 5) {
    const b = getBoldLength(len, ratio / 100);
    if (b >= len && len > 1) {
      console.log(`FAIL: len=${len} ratio=${ratio}% boldLen=${b}`);
      failCount++;
    }
  }
}
console.log(failCount === 0 ? 'ALL PASS' : `FAILURES: ${failCount}`);

// ── Test 6: Monotonic — more ratio = more bold ──
console.log('\n=== Test 6: Monotonic — higher ratio should produce >= bold length ===');
let monoFail = 0;
for (let len = 2; len <= 50; len++) {
  let prevBold = 0;
  for (let ratio = 10; ratio <= 90; ratio += 5) {
    const b = getBoldLength(len, ratio / 100);
    if (b < prevBold) {
      console.log(`FAIL: len=${len} ratio=${ratio}% bold=${b} < prev=${prevBold}`);
      monoFail++;
    }
    prevBold = b;
  }
}
console.log(monoFail === 0 ? 'ALL PASS' : `FAILURES: ${monoFail}`);

// ── Test 7: Visual examples at key ratios ──
console.log('\n=== Test 7: Visual examples ===');
const sampleWords = ['cat', 'hello', 'reading', 'comprehensive', 'internationalization', 'the', 'a', 'is', 'at'];
[0.1, 0.3, 0.5, 0.7, 0.9].forEach(ratio => {
  console.log(`\n--- Bold Ratio ${Math.round(ratio * 100)}% ---`);
  sampleWords.forEach(w => {
    console.log(`  ${boldWord(w, ratio)}`);
  });
});
