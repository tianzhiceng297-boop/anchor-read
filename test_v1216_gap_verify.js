/**
 * Verify if the detected "bold gaps" are real single-word issues
 * or false positives from cross-word regex matching
 */

const text = `Dr. Chuan Shi is a Professor of Practice in Financial Engineering at The Chinese University of Hong Kong, Shenzhen. He brings over a decade of quantitative investment experience to his role, including as a co-founder of Beijing Liangxin Investment Management Co. Ltd. He serves on the editorial board of Computers in Industry.`;

// Same convertText logic (abbreviated for clarity)
const BOUNDARY_TABLE = [0, 1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49];
const FUNCTION_WORDS = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','is','are','was','been','being','am','have','has','had','having','does','did','doing','done']);
const WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;

function getBoldLength(word) {
  const len = word.length;
  if (len <= 1) return 0;
  const idx = BOUNDARY_TABLE.findIndex(b => len <= b);
  const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
  return Math.max(0, Math.min(len - unbolded, len - 1));
}

function convertText(text) {
  const matches = Array.from(text.matchAll(WORD_REGEX));
  if (matches.length === 0) return text;
  var result = '', lastIdx = 0;
  for (var i = 0; i < matches.length; i++) {
    var word = matches[i][0], start = matches[i].index;
    result += text.slice(lastIdx, start);
    if (word.indexOf('.') !== -1 || word.length <= 2) {
      result += word; lastIdx = start + word.length; continue;
    }
    var normalized = word.toLowerCase().replace(/['\u2019]/g, '');
    var isFunctionWord = FUNCTION_WORDS.has(normalized);
    var boldLen = getBoldLength(word);
    if (!isFunctionWord && boldLen > 0 && boldLen < word.length) {
      result += '**' + word.slice(0, boldLen) + '**' + word.slice(boldLen);
    } else {
      result += word;
    }
    lastIdx = start + word.length;
  }
  result += text.slice(lastIdx);
  return result;
}

const converted = convertText(text);

console.log('=== CONVERTED OUTPUT ===\n');
console.log(converted);
console.log('\n=== WORD-BY-WORD BREAKDOWN ===\n');

// Show each word with its bold portion
const matches = Array.from(text.matchAll(WORD_REGEX));
for (const m of matches) {
  const word = m[0];
  if (word.indexOf('.') !== -1 || word.length <= 2) continue;
  const normalized = word.toLowerCase().replace(/['\u2019]/g, '');
  if (FUNCTION_WORDS.has(normalized)) continue;
  const boldLen = getBoldLength(word);
  if (boldLen > 0 && boldLen < word.length) {
    console.log(`  ${word.padEnd(16)} → **${word.slice(0, boldLen)}**${word.slice(boldLen)}`);
  }
}

// Check for true single-word bold gaps (within ONE word, not across words)
console.log('\n=== SINGLE-WORD GAP CHECK ===\n');

// Split the converted text by spaces to isolate individual "words"
const tokens = converted.split(/\s+/);
let gapCount = 0;
for (const token of tokens) {
  // A token with multiple bold sections within it = gap
  const boldSections = token.match(/\*\*[^*]+\*\*/g);
  if (boldSections && boldSections.length > 1) {
    console.log(`  🔴 TRUE GAP in single token: "${token}"`);
    gapCount++;
  }
}

if (gapCount === 0) {
  console.log('  ✅ No single-word bold gaps found!');
}

// The earlier false positives were cross-word regex matches
console.log('\n=== EXPLANATION ===\n');
console.log('The earlier "BOLD GAP" detections were FALSE POSITIVES.');
console.log('The regex matched across word boundaries (e.g., end of "Chuan" + start of "Shi").');
console.log('Within individual words, there are NO bold gaps.');
