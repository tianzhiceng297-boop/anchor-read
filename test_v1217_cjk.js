/**
 * AnchorRead v1.2.17 — CJK Bypass Test
 *
 * Validates that Chinese/Japanese/Korean characters are NOT bolded,
 * while English/Latin text continues to be processed normally.
 */

// ── Copy of the algorithm from content.js ────────────────────
const FUNCTION_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i',
  'it','for','not','on','with','he','as','you','do','at','this',
  'but','his','by','from','they','we','say','her','she','or',
  'an','will','my','one','all','would','there','their','what',
  'so','up','out','if','about','who','get','which','go','me',
  'when','make','can','like','time','no','just','him','know',
  'take','people','into','year','your','good','some','could','them',
  'see','other','than','then','now','look','only','come','its',
  'over','think','also','back','after','use','two','how','our',
  'work','first','well','way','even','new','want','because','any',
  'these','give','day','most','us','is','are','was','been',
  'being','am','have','has','had','having','does','did','doing',
  'done','isnt','arent','wasnt','werent','havent','hasnt',
  'hadnt','dont','doesnt','didnt','wont','wouldnt','shouldnt',
  'cant','couldnt','mustnt','mightnt','neednt',
  'its','lets','thats','whats','hows','wheres','whens','whys','whos',
  'ive','youve','weve','theyve','id','youll','hell','shell','well','theyll',
  'hes','shes','theyd','wed','youre','theyre','were','im',
]);

const BOUNDARY_TABLE = [
  0, 1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
  31, 33, 35, 37, 39, 41, 43, 45, 47, 49,
];

const LIGHT_LETTERS = new Set(['i', 'j', 'l', 'f', 't']);
const DESCENDERS  = new Set(['g', 'j', 'p', 'q', 'y']);
const ASCENDERS   = new Set(['b', 'd', 'f', 'h', 'k', 'l', 't']);

const OPTICAL_BOUNDARIES = {
  'water': 4, 'develop': 5, 'icon': 3, 'computer': 5,
  'information': 4, 'available': 5, 'important': 4, 'difference': 4,
  'understand': 5, 'necessary': 4, 'beautiful': 4, 'possible': 4,
  'interest': 5, 'capital': 4, 'literal': 4, 'moment': 3,
  'number': 3, 'people': 3, 'problem': 3, 'reason': 3,
  'second': 3, 'system': 3, 'thought': 4, 'window': 3,
  'without': 4, 'work': 2, 'world': 2, 'year': 2,
};

const SUFFIXES = [
  'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ical', 'ally',
  'ingly', 'fully', 'lessly', 'ously', 'ically',
  'ing', 'ed', 'er', 'est', 'y', 'ly', 'ty',
  'ive', 'ous', 'ious', 'eous',
  'al', 'ial', 'ful', 'less',
  'ize', 'ise', 'ify', 'ate', 'en',
];

const WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;
const CJK_RANGE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/;

function findOptimalBreak(word) {
  const len = word.length;
  if (len <= 2) return len;
  if (len === 3) return 2;
  const lower = word.toLowerCase();
  if (OPTICAL_BOUNDARIES[lower] !== undefined) return OPTICAL_BOUNDARIES[lower];
  for (const suffix of SUFFIXES) {
    if (lower.endsWith(suffix) && suffix.length < len) {
      const breakAt = len - suffix.length;
      if (breakAt >= 1 && breakAt < len && breakAt >= 2) return breakAt;
    }
  }
  for (let i = 1; i < len - 1; i++) {
    if (lower[i] === lower[i - 1] && i >= Math.floor(len / 3) && i <= Math.floor(len * 2 / 3)) {
      if (word[i] === word[i - 1]) {
        if (i - 1 >= Math.ceil(len * 0.3)) return i - 1;
        else if (i + 1 < len) return i + 1;
      }
      return i;
    }
  }
  const mid = Math.floor(len / 2);
  const leftBias = Math.max(1, Math.floor(len / 6));
  let candidate = mid - leftBias;
  if (candidate < 1) candidate = 1;
  if (candidate >= len) candidate = len - 1;
  if (LIGHT_LETTERS.has(word[candidate])) {
    let found = false;
    for (let i = candidate - 1; i >= 0; i--) {
      if (!LIGHT_LETTERS.has(word[i]) && i >= 1) { candidate = i + 1; found = true; break; }
    }
    if (!found && candidate < len - 1) candidate++;
  }
  if (candidate < len) {
    const nextCh = word[candidate];
    if (DESCENDERS.has(nextCh) || ASCENDERS.has(nextCh)) candidate++;
  }
  if (candidate < len - 1) {
    for (let i = candidate; i <= Math.min(candidate + 2, len - 1); i++) {
      if (DESCENDERS.has(word[i]) || ASCENDERS.has(word[i])) { candidate = i + 1; break; }
    }
  }
  const PLATFORM_LETTERS = new Set(['t', 'd', 'n', 'm', 'r', 's']);
  if (candidate > 1 && candidate < len) {
    if (!PLATFORM_LETTERS.has(word[candidate - 1])) {
      for (let i = candidate; i <= Math.min(candidate + 2, len - 1); i++) {
        if (PLATFORM_LETTERS.has(word[i])) { candidate = i + 1; break; }
      }
    }
  }
  if (candidate > 1 && candidate < len && word[candidate].toLowerCase() === word[candidate - 1].toLowerCase()) {
    if (candidate - 1 >= Math.ceil(len * 0.3)) candidate--;
    else if (candidate + 1 < len) candidate++;
  }
  candidate = Math.max(1, Math.min(candidate, len - 1));
  return candidate;
}

function getBoldLength(word) {
  const len = word.length;
  if (len <= 1) return 0;
  const idx = BOUNDARY_TABLE.findIndex(function (b) { return len <= b; });
  const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
  let boldLen = len - unbolded;
  const opticalBoldLen = findOptimalBreak(word);
  const deviation = Math.abs(boldLen - opticalBoldLen);
  if (deviation <= 2) boldLen = opticalBoldLen;
  var rawBoldLen = Math.max(0, Math.min(boldLen, len - 1));
  return applyMinBold(rawBoldLen, len);
}

function applyMinBold(boldLen, wordLen) {
  if (wordLen <= 2) return boldLen;
  if (wordLen <= 4) return Math.max(2, boldLen);
  if (wordLen <= 6) return Math.max(3, boldLen);
  var minBold = Math.max(3, Math.ceil(wordLen * 0.35));
  return Math.max(minBold, boldLen);
}

// ── convertText with CJK bypass (matching content.js) ──
function convertText(text) {
  const matches = Array.from(text.matchAll(WORD_REGEX));
  if (matches.length === 0) return text;
  var result = '';
  var lastIdx = 0;
  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    var word = match[0];
    var start = match.index;
    result += text.slice(lastIdx, start);
    if (word.indexOf('.') !== -1) { result += word; lastIdx = start + word.length; continue; }
    if (CJK_RANGE.test(word)) { result += word; lastIdx = start + word.length; continue; }
    if (word.length <= 2) { result += word; lastIdx = start + word.length; continue; }
    var normalized = word.toLowerCase().replace(/['\u2019]/g, '');
    var isFunctionWord = FUNCTION_WORDS.has(normalized);
    var boldLen = getBoldLength(word);
    if (!isFunctionWord && boldLen > 0 && boldLen < word.length) {
      result += '<b>' + word.slice(0, boldLen) + '</b>' + word.slice(boldLen);
    } else {
      result += word;
    }
    lastIdx = start + word.length;
  }
  result += text.slice(lastIdx);
  return result;
}

// ── Tests ─────────────────────────────────────
let passed = 0, failed = 0;

function test(name, input, predicate) {
  const result = convertText(input);
  const ok = predicate(result);
  if (ok) {
    passed++;
  } else {
    failed++;
    console.error('  FAIL: ' + name);
    console.error('    Input : ' + JSON.stringify(input));
    console.error('    Output: ' + JSON.stringify(result));
  }
}

// ── CJK: Must NOT contain any <b> tags ──
function noBold(result) { return !result.includes('<b>'); }
function hasBold(result) { return result.includes('<b>'); }

test('纯中文', '今天天气真好啊', noBold);
test('中文+标点', '你吃饭了吗？我也没吃。', noBold);
test('日文', '今日は良い天気ですね', noBold);
test('韩文', '안녕하세요 반갑습니다', noBold);
test('中文+数字', '2024年6月5日', noBold);
test('长句', '人工智能正在改变我们的生活方式和工作模式', noBold);

// ── English: Must still be bolded ──
test('英文单词', 'development', hasBold);
test('英文句子', 'This is a beautiful day', hasBold);
test('长英文', 'The information was extremely valuable', hasBold);

// ── Mixed: Only English parts bolded ──
function mixedCheck(text) {
  const result = convertText(text);
  // Chinese parts must remain as-is (not inside <b>)
  // We check that the CJK chars exist in raw form, not inside <b> tags
  const cjk = result.replace(/<b>[^<]*<\/b>/g, '');  // remove bold sections
  return cjk.includes('你好') || cjk.includes('世界') || cjk.includes('中文');
}

test('混排：中文+英文', 'Hello 中文 World', function(r) {
  return r.includes('<b>') && r.includes('中文');  // English bolded, Chinese untouched
});
test('混排：英文+中文+英文', 'I love 学习 programming', function(r) {
  return r.includes('<b>') && r.includes('学习');
});

// ── Summary ──
console.log('');
console.log('=== CJK Bypass Test Results ===');
console.log('  Passed: ' + passed + '/' + (passed + failed));
if (failed > 0) {
  console.log('  FAILED: ' + failed + ' test(s)');
  process.exit(1);
} else {
  console.log('  All tests passed!');
}
