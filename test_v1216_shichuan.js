/**
 * Test v1.2.16 against shichuan.info real content
 * Verifies: text not disappearing, no bold gaps, abbreviation handling
 */

// ── Extract text content from HTML ──
const html = `<!doctype html><html lang="en" class="no-js"><head><meta charset="utf-8"> <!-- begin SEO --><title>SHI, Chuan</title><meta property="og:locale" content="en-US"><meta property="og:site_name" content="SHI, Chuan"><meta property="og:title" content="SHI, Chuan"><link rel="canonical" href="https://www.shichuan.info/"><meta property="og:url" content="https://www.shichuan.info/"> <script type="application/ld+json"> { "@context" : "http://schema.org", "@type" : "Person", "name" : "SHI, Chuan", "url" : "https://www.shichuan.info", "sameAs" : null } </script> <!-- end SEO --><link href="https://www.shichuan.info/feed.xml" type="application/atom+xml" rel="alternate" title="SHI, Chuan Feed"> <!-- http://t.co/dKP3o1e --><meta name="HandheldFriendly" content="True"><meta name="MobileOptimized" content="320"><meta name="viewport" content="width=device-width, initial-scale=1.0"> <script> document.documentElement.className = document.documentElement.className.replace(/\\bno-js\\b/g, '') + ' js '; </script> <!-- For all browsers --><link rel="stylesheet" href="https://www.shichuan.info/assets/css/main.css"><meta http-equiv="cleartype" content="on"> <!-- start custom head snippets --><link rel="apple-touch-icon" sizes="57x57" href="https://www.shichuan.info/images/apple-touch-icon-57x57.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="60x60" href="https://www.shichuan.info/images/apple-touch-icon-60x60.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="72x72" href="https://www.shichuan.info/images/apple-touch-icon-72x72.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="76x76" href="https://www.shichuan.info/images/apple-touch-icon-76x76.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="114x114" href="https://www.shichuan.info/images/apple-touch-icon-114x114.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="120x120" href="https://www.shichuan.info/images/apple-touch-icon-120x120.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="144x144" href="https://www.shichuan.info/images/apple-touch-icon-144x144.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="152x152" href="https://www.shichuan.info/images/apple-touch-icon-152x152.png?v=M44lzPylqQ"><link rel="apple-touch-icon" sizes="180x180" href="https://www.shichuan.info/images/apple-touch-icon-180x180.png?v=M44lzPylqQ"><link rel="icon" type="image/png" href="https://www.shichuan.info/images/favicon-32x32.png?v=M44lzPylqQ" sizes="32x32"><link rel="icon" type="image/png" href="https://www.shichuan.info/images/android-chrome-192x192.png?v=M44lzPylqQ" sizes="192x192"><link rel="icon" type="image/png" href="https://www.shichuan.info/images/favicon-96x96.png?v=M44lzPylqQ" sizes="96x96"><link rel="icon" type="image/png" href="https://www.shichuan.info/images/favicon-16x16.png?v=M44lzPylqQ" sizes="16x16"><link rel="manifest" href="https://www.shichuan.info/images/manifest.json?v=M44lzPylqQ"><link rel="mask-icon" href="https://www.shichuan.info/images/safari-pinned-tab.svg?v=M44lzPylqQ" color="#000000"><link rel="shortcut icon" href="/images/favicon.ico?v=M44lzPylqQ"><meta name="msapplication-TileColor" content="#000000"><meta name="msapplication-TileImage" content="https://www.shichuan.info/images/mstile-144x144.png?v=M44lzPylqQ"><meta name="msapplication-config" content="https://www.shichuan.info/images/browserconfig.xml?v=M44lzPylqQ"><meta name="theme-color" content="#ffffff"><link rel="stylesheet" href="https://www.shichuan.info/assets/css/academicons.css"/> <!-- Support for MatJax --> <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script> <!-- end custom head snippets --></head><body> <!--[if lt IE 9]><div class="notice--danger align-center" style="margin: 0;">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</div><![endif]--><div class="masthead"><div class="masthead__inner-wrap"><div class="masthead__menu"><nav id="site-nav" class="greedy-nav"> <button><div class="navicon"></div></button><ul class="visible-links"><li class="masthead__menu-item masthead__menu-item--lg"><a href="https://www.shichuan.info/">SHI, Chuan</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/publications/">Publications</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/talks/">Talks</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/teaching/">Teaching</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/blog/">Blog</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/code-and-data/">Code and Data</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/cv/">CV</a></li><li class="masthead__menu-item"><a href="https://www.shichuan.info/contact/">Contact</a></li></ul><ul class="hidden-links hidden"></ul></nav></div></div></div><div id="main" role="main"><div class="sidebar sticky"><div itemscope itemtype="http://schema.org/Person"><div class="author__avatar"> <img src="https://www.shichuan.info/images/shichuan.jpg" class="author__avatar" alt="SHI, Chuan"></div><div class="author__content"><h3 class="author__name">SHI, Chuan</h3><p class="author__bio">Data Scientist</p></div><div class="author__urls-wrapper"> <button class="btn btn--inverse">Follow</button><ul class="author__urls social-icons"> <!-- Font Awesome icons / Biographic information --><li><i class="fa-solid fa-location-dot icon-pad-right" aria-hidden="true"></i>Shenzhen/Hong Kong</li><!-- Font Awesome and Academicons icons / Academic websites --><li><a href="https://scholar.google.com/citations?hl=en&user=nBJMz38AAAAJ" target="_blank"><i class="ai ai-google-scholar icon-pad-right"></i>Google Scholar</a></li><li><a href="http://orcid.org/0000-0003-2564-4155" target="_blank"><i class="ai ai-orcid ai-fw icon-pad-right"></i>ORCID</a></li><!-- Font Awesome icons / Repositories and software development --> <!-- Font Awesome icons / Social media --><li><a href="https://www.linkedin.com/in/chuan-shi-b692051a" target="_blank"><i class="fab fa-fw fa-linkedin icon-pad-right" aria-hidden="true"></i>LinkedIn</a></li><li><a href="https://www.zhihu.com/people/mitcshi" target="_blank"><i class="fab fa-fw fa-zhihu icon-pad-right" aria-hidden="true"></i>Zhihu</a></li></ul></div></div></div><article class="page" itemscope itemtype="http://schema.org/CreativeWork"><div class="page__inner-wrap"><header></header><section class="page__content" itemprop="text"><p>Dr. Chuan Shi is a Professor of Practice in Financial Engineering at The Chinese University of Hong Kong, Shenzhen. He brings over a decade of quantitative investment experience to his role, including as a co-founder of Beijing Liangxin Investment Management Co. Ltd. He serves on the editorial board of <em>Computers in Industry</em>.</p><p>He holds a Ph.D. degree from MIT, specializing in operations research. Before this, he graduated from Tsinghua University with both B.Eng. and M.Eng. degrees. His academic journey has been marked by contributions to optimizing manufacturing systems, bridging both theoretical advances and practical applications. With extensive experience in data analysis, statistical modeling, and machine learning, he has applied these skills to large-scale financial data in the finance sector. His work stands at the intersection of high-level academic research and practical industry application, making him uniquely positioned to offer valuable insights and innovations in data science.</p><p>Throughout his career, Dr. Shi has been dedicated to pushing the boundaries of data science, particularly in the realm of manufacturing systems and quantitative financial research. As a passionate educator, he has also been involved in teaching and mentoring students, aiming to inspire the next generation of data scientists. His work has been recognized in various academic and industrial circles, leading to collaborative projects to apply cutting-edge research in real-world scenarios.</p></section><footer class="page__meta"></footer></div></article></div><div class="page__footer"><footer> <!-- start custom footer snippets --> <!-- <a href="/sitemap/">Sitemap</a> --> <!-- end custom footer snippets --> <!--<div class="page__footer-follow"><ul class="social-icons"><li><strong>Follow:</strong></li><li><a href="https://www.shichuan.info/feed.xml"><i class="fa fa-fw fa-rss-square" aria-hidden="true"></i> Feed</a></li></ul></div>--><div class="page__footer-copyright">&copy; 2026 SHI, Chuan.</div></footer></div><script src="https://www.shichuan.info/assets/js/main.min.js"></script> <script> (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,'script','//www.google-analytics.com/analytics.js','ga'); ga('create', '', 'auto'); ga('send', 'pageview'); </script></body></html>`;

// ── Extract text paragraphs from HTML ──
const textBlocks = [];
const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
let match;
while ((match = pRegex.exec(html)) !== null) {
  // Strip HTML tags to get plain text
  const text = match[1].replace(/<[^>]+>/g, '').trim();
  if (text.length > 10) textBlocks.push(text);
}

console.log(`Found ${textBlocks.length} text blocks:\n`);

// ── Run convertText algorithm (same as content.js) ──
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
  'water':       4,  'develop':     5,  'icon':        3,
  'computer':    5,  'information': 4,  'available':   5,
  'important':   4,  'difference':  4,  'understand':  5,
  'necessary':   4,  'beautiful':  4,  'possible':    4,
  'interest':    5,  'capital':     4,  'literal':     4,
  'moment':      3,  'number':      3,  'people':      3,
  'problem':     3,  'reason':      3,  'second':      3,
  'system':      3,  'thought':     4,  'window':      3,
  'without':     4,  'work':        2,  'world':       2,
  'year':        2,
};

const SUFFIXES = [
  'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ical', 'ally',
  'ingly', 'fully', 'lessly', 'ously', 'ically',
  'ing', 'ed', 'er', 'est', 'y', 'ly', 'ty',
  'ive', 'ous', 'ious', 'eous',
  'al', 'ial', 'ful', 'less',
  'ize', 'ise', 'ify', 'ate', 'en',
];

function findOptimalBreak(word) {
  const len = word.length;
  if (len <= 2) return len;
  if (len === 3) return 2;

  const lower = word.toLowerCase();

  if (OPTICAL_BOUNDARIES[lower] !== undefined) {
    return OPTICAL_BOUNDARIES[lower];
  }

  for (const suffix of SUFFIXES) {
    if (lower.endsWith(suffix) && suffix.length < len) {
      const breakAt = len - suffix.length;
      if (breakAt >= 1 && breakAt < len && breakAt >= 2) {
        return breakAt;
      }
    }
  }

  for (let i = 1; i < len - 1; i++) {
    if (lower[i] === lower[i - 1]
        && i >= Math.floor(len / 3)
        && i <= Math.floor(len * 2 / 3)) {
      if (word[i] === word[i - 1]) {
        if (i - 1 >= Math.ceil(len * 0.3)) {
          return i - 1;
        } else if (i + 1 < len) {
          return i + 1;
        }
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
      if (!LIGHT_LETTERS.has(word[i]) && i >= 1) {
        candidate = i + 1;
        found = true;
        break;
      }
    }
    if (!found && candidate < len - 1) {
      candidate++;
    }
  }

  if (candidate < len) {
    const nextCh = word[candidate];
    if (DESCENDERS.has(nextCh) || ASCENDERS.has(nextCh)) {
      candidate++;
    }
  }

  if (candidate < len - 1) {
    for (let i = candidate; i <= Math.min(candidate + 2, len - 1); i++) {
      if (DESCENDERS.has(word[i]) || ASCENDERS.has(word[i])) {
        candidate = i + 1;
        break;
      }
    }
  }

  const PLATFORM_LETTERS = new Set(['t', 'd', 'n', 'm', 'r', 's']);
  if (candidate > 1 && candidate < len) {
    if (!PLATFORM_LETTERS.has(word[candidate - 1])) {
      for (let i = candidate; i <= Math.min(candidate + 2, len - 1); i++) {
        if (PLATFORM_LETTERS.has(word[i])) {
          candidate = i + 1;
          break;
        }
      }
    }
  }

  if (candidate > 1 && candidate < len && word[candidate].toLowerCase() === word[candidate - 1].toLowerCase()) {
    if (candidate - 1 >= Math.ceil(len * 0.3)) {
      candidate--;
    } else if (candidate + 1 < len) {
      candidate++;
    }
  }

  candidate = Math.max(1, Math.min(candidate, len - 1));
  return candidate;
}

function applyMinBold(boldLen, wordLen) {
  if (wordLen <= 2) return boldLen;
  if (wordLen <= 4) return Math.max(2, boldLen);
  if (wordLen <= 6) return Math.max(3, boldLen);
  var minBold = Math.max(3, Math.ceil(wordLen * 0.35));
  return Math.max(minBold, boldLen);
}

function getBoldLength(word) {
  const len = word.length;
  if (len <= 1) return 0;

  const idx = BOUNDARY_TABLE.findIndex(function (b) {
    return len <= b;
  });
  const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
  let boldLen = len - unbolded;

  const opticalBoldLen = findOptimalBreak(word);
  const deviation = Math.abs(boldLen - opticalBoldLen);
  if (deviation <= 2) {
    boldLen = opticalBoldLen;
  }

  var rawBoldLen = Math.max(0, Math.min(boldLen, len - 1));
  return applyMinBold(rawBoldLen, len);
}

const WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;

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

    if (word.indexOf('.') !== -1) {
      result += word;
      lastIdx = start + word.length;
      continue;
    }

    if (word.length <= 2) {
      result += word;
      lastIdx = start + word.length;
      continue;
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

// ── Run tests ──
console.log('=== TEST RESULTS ===\n');

let totalWords = 0;
let boldedWords = 0;
let skippedWords = 0;
let issues = [];

for (const block of textBlocks) {
  const converted = convertText(block);

  // Count words
  const wordMatches = Array.from(block.matchAll(WORD_REGEX));
  for (const m of wordMatches) {
    const word = m[0];
    totalWords++;
    if (word.indexOf('.') !== -1 || word.length <= 2) {
      skippedWords++;
    }
  }

  // Count bolded words in output
  const boldMatches = converted.match(/\*\*[^*]+\*\*/g);
  if (boldMatches) boldedWords += boldMatches.length;

  // Check for specific problematic words
  const problemWords = ['Professor', 'Shenzhen', 'uniquely', 'level', 'Before', 'stands'];
  for (const pw of problemWords) {
    const regex = new RegExp(`\\*\\*([^*]+)\\*\\*(${pw.slice(1)})`, 'i');
    const match = converted.match(new RegExp(`\\*\\*([^*]{1,3})\\*\\*${pw.slice(1)}`, 'i'));
    if (match) {
      // Check if bold portion is suspiciously short
      if (match[1].length <= 2 && pw.length > 4) {
        issues.push(`⚠️  "${pw}" bold too short: "${match[1]}" (${match[1].length}/${pw.length} = ${Math.round(match[1].length/pw.length*100)}%)`);
      }
    }
  }

  // Check for bold-gap-bold pattern (the original bug)
  const gapPattern = /\*\*[^*]+\*\*[^*\s]{1,2}\*\*[^*]+\*\*/g;
  const gaps = converted.match(gapPattern);
  if (gaps) {
    for (const gap of gaps) {
      issues.push(`🔴 BOLD GAP detected: "${gap}"`);
    }
  }

  // Check for single-char bolds
  const singleCharBold = /\*\*([a-zA-Z])\*\*/g;
  let scMatch;
  while ((scMatch = singleCharBold.exec(converted)) !== null) {
    issues.push(`⚠️  Single-char bold: "${scMatch[0]}" in context "...${converted.slice(Math.max(0, scMatch.index - 10), scMatch.index + 12)}..."`);
  }
}

console.log(`Total words processed: ${totalWords}`);
console.log(`Words bolded: ${boldedWords}`);
console.log(`Words skipped (≤2 chars or abbreviations): ${skippedWords}`);
console.log(`Bold rate: ${Math.round(boldedWords/totalWords*100)}%\n`);

if (issues.length === 0) {
  console.log('✅ No issues detected!\n');
} else {
  console.log(`❌ ${issues.length} issue(s) found:\n`);
  for (const issue of issues) {
    console.log(`  ${issue}`);
  }
  console.log('');
}

// ── Show first paragraph converted (visual check) ──
console.log('=== SAMPLE OUTPUT (first paragraph) ===\n');
console.log(convertText(textBlocks[0]));
console.log('\n=== FULL OUTPUT (all paragraphs) ===\n');
for (let i = 0; i < textBlocks.length; i++) {
  console.log(`--- Paragraph ${i + 1} ---`);
  console.log(convertText(textBlocks[i]));
  console.log('');
}

// ── Specific word analysis ──
console.log('=== SPECIFIC WORD ANALYSIS ===\n');
const testWords = ['Professor', 'Practice', 'Financial', 'Engineering', 'Shenzhen', 'Hong', 'Kong',
  'quantitative', 'investment', 'experience', 'including', 'co-founder', 'Beijing',
  'Liangxin', 'Investment', 'Management', 'editorial', 'degree', 'specializing',
  'operations', 'research', 'graduated', 'Tsinghua', 'University', 'academic',
  'journey', 'contributions', 'optimizing', 'manufacturing', 'systems',
  'theoretical', 'advances', 'practical', 'applications', 'extensive',
  'analysis', 'statistical', 'modeling', 'machine', 'learning', 'intersection',
  'high-level', 'uniquely', 'positioned', 'valuable', 'insights', 'innovations',
  'dedicated', 'pushing', 'boundaries', 'particularly', 'realm', 'passionate',
  'educator', 'mentoring', 'inspire', 'generation', 'scientists', 'recognized',
  'collaborative', 'cutting-edge', 'real-world', 'scenarios'];

for (const word of testWords) {
  const boldLen = getBoldLength(word);
  const pct = Math.round(boldLen / word.length * 100);
  const bolded = word.slice(0, boldLen);
  const rest = word.slice(boldLen);
  const marker = boldLen === 0 ? '(skip)' : boldLen >= word.length ? '(full)' : '';
  console.log(`  ${word.padEnd(16)} → **${bolded}**${rest}  (${boldLen}/${word.length} = ${pct}%) ${marker}`);
}
