/**
 * verify-algo.js — Verify AnchorRead v1.2.4 fixed algorithm
 * Uses text-vide fp3 boundary table (fixationPoint=3, default).
 */

const BOUNDARY_TABLE = [
  1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
  31, 33, 35, 37, 39, 41, 43, 45, 47, 49,
];

function getBoldLength(word) {
  const len = word.length;
  if (len <= 1) return 0;
  const idx = BOUNDARY_TABLE.findIndex(b => len <= b);
  const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
  const boldLen = len - unbolded;
  return Math.max(0, Math.min(boldLen, len - 1));
}

// ── Test 1: exact matches from text-vide HOW.md (fp3) ──
const HOW_TESTS = [
  ['reading', 7, 4],
  ['comprehensive', 13, 7],
  ['hello', 5, 3],
  ['bionic', 6, 3],
  ['cat', 3, 1],
  ['a', 1, 0],
  ['it', 2, 1],
];

console.log('=== Test 1: text-vide HOW.md exact matches (fp3) ===');
let pass1 = 0;
for (const [word, len, expectedBold] of HOW_TESTS) {
  const result = getBoldLength(word);
  const ok = result === expectedBold;
  if (ok) pass1++;
  console.log(
    ok ? '  ✅' : '  ❌',
    `"${word}" (len=${len}): expected bold=${expectedBold}, got ${result}`,
    ok ? '' : '  ← MISMATCH'
  );
}
console.log(`Test 1: ${pass1}/${HOW_TESTS.length} passed\n`);

// ── Test 2: never bold entire word ──
console.log('=== Test 2: never bold entire word (all lengths 1-60) ===');
let pass2 = 0;
for (let len = 1; len <= 60; len++) {
  const word = 'w'.repeat(len);
  const bold = getBoldLength(word);
  const ok = bold >= 0 && bold < len;
  if (ok) pass2++;
  if (!ok) console.log(`  ❌ len=${len}: bold=${bold} (must be < ${len})`);
}
console.log(`Test 2: ${pass2}/60 passed (all lengths 1-60)\n`);

// ── Test 3: monotonicity — longer words get >= bold ──
console.log('=== Test 3: monotonicity ===');
let pass3 = true;
const results = {};
for (let len = 1; len <= 50; len++) {
  results[len] = getBoldLength('w'.repeat(len));
}
for (let len = 2; len <= 50; len++) {
  if (results[len] < results[len - 1]) {
    console.log(`  ❌ Non-monotonic: len=${len - 1}→${len}: ${results[len - 1]}→${results[len]}`);
    pass3 = false;
  }
}
if (pass3) console.log('  ✅ Monotonicity holds for all lengths 1-50\n');
else console.log();

// ── Test 4: print sample table for visual inspection ──
console.log('=== Test 4: sample bold lengths (fp3 fixed) ===');
const SAMPLE_WORDS = [
  'a', 'an', 'the', 'cat', 'hello', 'world', 'reading',
  'bionic', 'computer', 'comprehensive', 'antidisestablishmentarianism',
];
for (const w of SAMPLE_WORDS) {
  const b = getBoldLength(w);
  const displayed = '**' + w.slice(0, b) + '**' + w.slice(b);
  console.log(`  ${w.padEnd(16)} len=${String(w.length).padEnd(3)} bold=${b}  → ${displayed}`);
}
console.log('\n=== All tests complete ===');
