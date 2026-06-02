/**
 * Verify getBoldLength() against text-vide's reverse-subtraction strategy.
 * Run: node verify-algo.js
 */

const FIXATION_BOUNDARIES = [0, 4, 12, 17, 24, 29, 35, 42, 48];

function getBoldLength(word, boldRatio) {
  const len = word.length;
  if (len <= 1) return 0;

  let unboldBase = 0;
  for (let i = 0; i < FIXATION_BOUNDARIES.length; i++) {
    if (len <= FIXATION_BOUNDARIES[i]) {
      unboldBase = i;
      break;
    }
  }
  if (unboldBase === 0 && len > FIXATION_BOUNDARIES[FIXATION_BOUNDARIES.length - 1]) {
    unboldBase = FIXATION_BOUNDARIES.length - 1;
  }

  const scaleFactor = boldRatio / 0.5;
  const unboldScaled = Math.max(1, Math.round(unboldBase / scaleFactor));
  const boldLen = len - unboldScaled;
  return Math.max(1, Math.min(boldLen, len - 1));
}

// Test words covering boundary table ranges
const TEST_WORDS = [
  { word: 'a',       len: 1,  desc: 'len=1, always 0' },
  { word: 'is',       len: 2,  desc: 'len=2, boundary [0]' },
  { word: 'the',      len: 3,  desc: 'len=3, boundary [0,4)' },
  { word: 'with',     len: 4,  desc: 'len=4, boundary value' },
  { word: 'anchor',   len: 6,  desc: 'len=6, boundary [4,12)' },
  { word: 'reading',  len: 8,  desc: 'len=8, boundary [4,12)' },
  { word: 'algorithm',len: 9,  desc: 'len=9, boundary [4,12)' },
  { word: 'comprehensive', len: 14, desc: 'len=14, boundary [12,17)' },
  { word: 'international',   len: 13, desc: 'len=13, boundary [12,17)' },
  { word: 'communication',    len: 13, desc: 'len=13, boundary [12,17)' },
  { word: 'extraordinary',   len: 13, desc: 'len=13, same as above' },
  { word: 'acknowledgment',  len: 15, desc: 'len=15, boundary [12,17)' },
  { word: 'congratulations', len: 16, desc: 'len=16, boundary [12,17)' },
  { word: 'responsibilities', len: 16, desc: 'len=16, boundary [12,17)' },
  { word: 'a'.repeat(25),   len: 25, desc: 'len=25, boundary [24,29)' },
  { word: 'b'.repeat(30),   len: 30, desc: 'len=30, boundary [29,35)' },
  { word: 'c'.repeat(50),   len: 50, desc: 'len=50, beyond table' },
];

const RATIOS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

console.log('=== AnchorRead Algorithm Verification (text-vide reverse-subtraction) ===\n');

// Header
console.log('Word'.padEnd(20), 'Len', ...RATIOS.map(r => ` ${(r*100).toFixed(0)}%`.padStart(5)));
console.log('─'.repeat(90));

for (const { word, len, desc } of TEST_WORDS) {
  const display = word.length > 20 ? word.slice(0, 17) + '...' : word;
  const row = [display.padEnd(20), String(len).padStart(3)];
  for (const r of RATIOS) {
    const bl = getBoldLength(word, r);
    const pct = ((bl / len) * 100).toFixed(0);
    // Show "N/P%" e.g. "3/30%"
    row.push(` ${bl}/${pct}%`.padStart(6));
  }
  console.log(...row);
  // Sanity checks
  const b50 = getBoldLength(word, 0.5);
  const b90 = getBoldLength(word, 0.9);
  const b10 = getBoldLength(word, 0.1);
  if (b10 > b50) console.error(`  ERROR: 10% (${b10}) > 50% (${b50}) for "${display}"`);
  if (b90 < b50) console.error(`  ERROR: 90% (${b90}) < 50% (${b50}) for "${display}"`);
  if (b50 >= len) console.error(`  ERROR: boldLen (${b50}) >= len (${len}) for "${display}"`);
  if (b50 === 0 && len > 1) console.error(`  ERROR: boldLen=0 for len=${len} "${display}"`);
}

console.log('\n=== Sanity Checks ===');
// Key invariant: at ratio=0.5, must match boundary table exactly
console.log('\nRatio=0.5 (default) bold/len breakdown:');
for (const { word, len } of TEST_WORDS) {
  if (len <= 1) continue;
  const bl = getBoldLength(word, 0.5);
  console.log(`  "${word}" (${len}) → bold=${bl} (${(bl/len*100).toFixed(0)}%)`);
}

// Verify "never bold entire word" invariant holds for all ratios
console.log('\nChecking "never bold entire word" invariant...');
let invariantPass = true;
for (const { word, len } of TEST_WORDS) {
  for (const r of RATIOS) {
    const bl = getBoldLength(word, r);
    if (bl >= len) {
      console.error(`  FAIL: "${word}" len=${len} boldLen=${bl} at ${(r*100).toFixed(0)}%`);
      invariantPass = false;
    }
    if (bl < 1 && len > 1) {
      console.error(`  FAIL: "${word}" boldLen=${bl} (should be >=1) at ${(r*100).toFixed(0)}%`);
      invariantPass = false;
    }
  }
}
if (invariantPass) console.log('  PASS: invariant holds for all test words at all ratios.');

console.log('\nDone.');
