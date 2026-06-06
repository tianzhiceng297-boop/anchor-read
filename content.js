/**
 * AnchorRead - Content Script
 *
 * Converts page text by bolding the first portion of each word,
 * using the text-vide verified Fixation Boundary Table algorithm.
 *
 * v1.3.0: Add PDF viewer support — popup detects PDF pages, opens in pdf-viewer
 * v1.4.0: Keyboard shortcut (Alt+A), copy-fix, per-site blacklist
 */
(function () {
  'use strict';

  // Avoid double injection
  if (window.__anchorReadInjected) return;
  window.__anchorReadInjected = true;

  // ── Function Words (skip bolding) ────────────
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

  // ── text-vide Verified Fixation Boundary Table ──
  const BOUNDARY_TABLE = [
    0, 1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
    31, 33, 35, 37, 39, 41, 43, 45, 47, 49,
  ];

  // ── Optical Balance: Letter Visual Weight ──
  const LIGHT_LETTERS = new Set(['i', 'j', 'l', 'f', 't']);
  const DESCENDERS  = new Set(['g', 'j', 'p', 'q', 'y']);
  const ASCENDERS   = new Set(['b', 'd', 'f', 'h', 'k', 'l', 't']);

  const OPTICAL_BOUNDARIES = {
    'water':       4,  // wate|r  (t = visual anchor)
    'develop':     5,  // devel|op (syllable + p descender anchors)
    'icon':        3,  // ico|n  (c opens right, blends into o)
    'computer':    5,  // comp|uter
    'information': 4,  // info|rmation
    'available':   5,  // avail|able
    'important':   4,  // impo|rtant
    'difference':  4,  // diff|erence
    'understand':  5,  // under|stand
    'necessary':   4,  // neces|sary
    'beautiful':  4,  // beau|tiful
    'possible':    4,  // poss|ible
    'interest':    5,  // inter|est
    'capital':     4,  // capit|al
    'literal':     4,  // lit|eral
    'moment':      3,  // mom|ent
    'number':      3,  // num|ber
    'people':      3,  // peo|ple
    'problem':     3,  // prob|lem
    'reason':      3,  // rea|son
    'second':      3,  // sec|ond
    'system':      3,  // sys|tem
    'thought':     4,  // thou|ght
    'window':      3,  // win|dow
    'without':     4,  // with|out
    'work':        2,  // wo|rk
    'world':       2,  // wo|rld
    'year':        2,  // ye|ar
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

    // Priority 1: hand-crafted table
    if (OPTICAL_BOUNDARIES[lower] !== undefined) {
      return OPTICAL_BOUNDARIES[lower];
    }

    // Priority 2: suffix boundary
    for (const suffix of SUFFIXES) {
      if (lower.endsWith(suffix) && suffix.length < len) {
        const breakAt = len - suffix.length;
        if (breakAt >= 1 && breakAt < len && breakAt >= 2) {
          return breakAt;
        }
      }
    }

    // Priority 2b: double consonant syllabification
    for (let i = 1; i < len - 1; i++) {
      if (lower[i] === lower[i - 1]
          && i >= Math.floor(len / 3)
          && i <= Math.floor(len * 2 / 3)) {
        // Avoid invisible boundary between identical letters
        // (e.g. "Professor" breaking as Profes|sor where s→s is invisible)
        if (word[i] === word[i - 1]) {
          if (i - 1 >= Math.ceil(len * 0.3)) {
            return i - 1; // shift left (prefer shorter bold)
          } else if (i + 1 < len) {
            return i + 1; // shift right
          }
        }
        return i;
      }
    }

    // Priority 3: geometric midpoint, biased LEFT
    const mid = Math.floor(len / 2);
    const leftBias = Math.max(1, Math.floor(len / 6));
    let candidate = mid - leftBias;
    if (candidate < 1) candidate = 1;
    if (candidate >= len) candidate = len - 1;

    // Priority 4: avoid heavy-light-heavy jumps
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

    // Priority 5: prefer ending on a descender/ascender
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

    // Priority 5b: "platform" letter rule
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

    // Priority 6: avoid invisible boundary between identical letters
    // E.g. "Professor" breaking between double-s: Profes|sor
    // The bold→regular transition is invisible since both sides are 's'
    if (candidate > 1 && candidate < len && word[candidate].toLowerCase() === word[candidate - 1].toLowerCase()) {
      // Prefer shifting left (shorter bold) for optical balance,
      // unless that makes bold too short (< 30% of word)
      if (candidate - 1 >= Math.ceil(len * 0.3)) {
        candidate--;
      } else if (candidate + 1 < len) {
        candidate++;
      }
    }

    candidate = Math.max(1, Math.min(candidate, len - 1));
    return candidate;
  }

  function getBoldLength(word) {
    const len = word.length;
    if (len <= 1) return 0;

    // Step 1: text-vide boundary table (baseline)
    const idx = BOUNDARY_TABLE.findIndex(function (b) {
      return len <= b;
    });
    const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
    let boldLen = len - unbolded;

    // Step 2: Optical balance adjustment
    const opticalBoldLen = findOptimalBreak(word);
    const deviation = Math.abs(boldLen - opticalBoldLen);
    if (deviation <= 2) {
      boldLen = opticalBoldLen;
    }

    var rawBoldLen = Math.max(0, Math.min(boldLen, len - 1));
    return applyMinBold(rawBoldLen, len);
  }

  // ── Minimum bold threshold ──────────────
  // Ensure the bold portion is visually meaningful.
  // Single-char bolds (e.g. "l"evel) look broken,
  // especially next to words with longer bolds.
  function applyMinBold(boldLen, wordLen) {
    if (wordLen <= 2) return boldLen;              // skip short words entirely
    if (wordLen <= 4) return Math.max(2, boldLen); // 3-4 char words: at least 2 bold
    if (wordLen <= 6) return Math.max(3, boldLen); // 5-6 char words: at least 3 bold (≥50%)
    var minBold = Math.max(3, Math.ceil(wordLen * 0.35)); // longer: ≥35%, min 3
    return Math.max(minBold, boldLen);
  }

  // ── Word Regex ─────────────────────────────
  // Match letters, allowing internal hyphens, dots, and apostrophes.
  // This ensures compound words (high-level) and contractions (don't)
  // are treated as single units so bolding doesn't restart mid-word.
  const WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;

  // ── CJK Range ───────────────────────────────
  // AnchorRead is designed for Latin-script text only.
  // CJK characters (Chinese, Japanese, Korean) should never be bolded.
  const CJK_RANGE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/;

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
    'NOSCRIPT', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'CODE', 'PRE',
    'B', 'STRONG', 'EM', 'I', 'MARK',
  ]);

  // ── Text Conversion ───────────────────────────
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

      // ── Skip abbrevations containing periods (Ph.D., B.Eng., Co., etc.) ──
      if (word.indexOf('.') !== -1) {
        result += word;
        lastIdx = start + word.length;
        continue;
      }

      // ── Skip CJK text (Chinese, Japanese, Korean) ──
      // AnchorRead is designed for Latin-script text. Bolding CJK
      // characters disrupts their layout and readability.
      if (CJK_RANGE.test(word)) {
        result += word;
        lastIdx = start + word.length;
        continue;
      }

      // Skip very short words (≤2 chars) — mostly abbreviations, punctuation artifacts
      if (word.length <= 2) {
        result += word;
        lastIdx = start + word.length;
        continue;
      }
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

  // ── DOM Processing ────────────────────────────
  function shouldSkipNode(node) {
    let parent = node.parentElement;
    while (parent) {
      if (SKIP_TAGS.has(parent.tagName)) return true;
      // Also skip if inside an already-processed anchor span
      // (handles text nodes inside <b> within <span data-anchor-original>)
      if (parent.hasAttribute && parent.hasAttribute('data-anchor-original')) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function processTextNode(node) {
    if (!node.textContent || node.textContent.trim().length === 0) return;
    if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return;
    if (shouldSkipNode(node)) return;

    const original = node.textContent;
    const converted = convertText(original);
    if (converted === original) return;

    const span = document.createElement('span');
    span.setAttribute('data-anchor-original', original);
    span.innerHTML = converted;
    node.parentNode.replaceChild(span, node);
  }

  // ── Split-Word Grouping ──────────────────────
  // SPA frameworks (React, Vue) and MathJax/KaTeX often split a single
  // word across multiple DOM elements, e.g. <span>Prof</span><span>essor</span>
  // or <span class="mjx">optim</span><span class="mjx">izing</span>.
  // Without grouping, each fragment gets processed as an independent
  // "word" with its own boldLen, creating visible gaps like **Pro**f**es**sor.
  // This function groups adjacent text nodes that form continuous words
  // (letter-to-letter boundary with no whitespace/punctuation between them).
  //
  // Grouping policy:
  //   ✅ SAME parent       → group freely
  //   ✅ SIBLING parents   → group (safe: common grandparent for span insert)
  //   ❌ ANCESTOR-DESCENDANT → DO NOT group (would cascade-remove the span)
  function groupTextNodes(textNodes) {
    if (!textNodes || textNodes.length === 0) return [];
    var groups = [];
    var used = new Set();

    for (var i = 0; i < textNodes.length; i++) {
      if (used.has(textNodes[i])) continue;

      var group = [textNodes[i]];
      used.add(textNodes[i]);

      for (var j = i + 1; j < textNodes.length; j++) {
        if (used.has(textNodes[j])) continue;

        // Check if parents are compatible for grouping
        var prevParent = group[group.length - 1].parentNode;
        var nextParent = textNodes[j].parentNode;

        if (prevParent !== nextParent) {
          // Allow grouping if parents are SIBLINGS (same grandparent)
          // — common for MathJax, KaTeX, and SPA split-word spans.
          // Reject if parents are in ANCESTOR-DESCENDANT relationship,
          // which would cause text disappearance during replacement.
          var prevGrandparent = prevParent && prevParent.parentNode;
          var nextGrandparent = nextParent && nextParent.parentNode;
          if (!prevGrandparent || !nextGrandparent || prevGrandparent !== nextGrandparent) break;
        }

        var lastText = group[group.length - 1].textContent;
        var nextText = textNodes[j].textContent;

        // Both ends must be letters → no whitespace/punctuation between them
        if (/\p{L}$/u.test(lastText) && /^\p{L}/u.test(nextText)) {
          group.push(textNodes[j]);
          used.add(textNodes[j]);
        } else {
          break; // word boundary found — stop extending this group
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // ── Process a group of text nodes as one unit ──
  function processTextNodeGroup(textNodes) {
    // Merge all text from the group
    var combinedText = '';
    for (var i = 0; i < textNodes.length; i++) {
      combinedText += textNodes[i].textContent;
    }

    var converted = convertText(combinedText);
    if (converted === combinedText) return; // nothing to bold

    // Check if all nodes share the same parent element
    var firstParent = textNodes[0].parentNode;
    var sameParent = true;
    for (var i = 1; i < textNodes.length; i++) {
      if (textNodes[i].parentNode !== firstParent) {
        sameParent = false;
        break;
      }
    }

    // Check if all parent elements are SIBLINGS (for the cross-parent case)
    var allSiblings = false;
    var commonGrandparent = null;
    if (!sameParent && firstParent) {
      commonGrandparent = firstParent.parentNode;
      allSiblings = true;
      for (var i = 1; i < textNodes.length; i++) {
        var p = textNodes[i].parentNode;
        if (!p || p.parentNode !== commonGrandparent) {
          allSiblings = false;
          break;
        }
      }
    }

    var span = document.createElement('span');

    if (!sameParent && firstParent && firstParent !== document.body) {
      // Copy styling attributes from first parent to preserve appearance
      for (var i = 0; i < firstParent.attributes.length; i++) {
        var attr = firstParent.attributes[i];
        if (attr.name !== 'data-anchor-original') {
          span.setAttribute(attr.name, attr.value);
        }
      }
    }

    span.setAttribute('data-anchor-original', combinedText);
    span.innerHTML = converted;

    if (sameParent) {
      // All text nodes are in the same parent — insert span, remove text nodes
      firstParent.appendChild(span);
      for (var i = 0; i < textNodes.length; i++) {
        if (textNodes[i].parentNode) {
          textNodes[i].parentNode.removeChild(textNodes[i]);
        }
      }
    } else if (allSiblings && commonGrandparent) {
      // SIBLING parents (e.g. <span>degr</span><span>ees</span> inside same <p>)
      // Safe: insert span as child of grandparent, remove all original parents
      commonGrandparent.insertBefore(span, textNodes[0].parentNode);
      for (var i = 0; i < textNodes.length; i++) {
        var parent = textNodes[i].parentNode;
        if (parent) {
          parent.parentNode.removeChild(parent);
        }
      }
    } else {
      // Different parent elements in ANCESTOR-DESCENDANT relationship
      // — SAFETY: fall back to individual processing.
      // Removing an ancestor would cascade-remove the span we just inserted.
      for (var i = 0; i < textNodes.length; i++) {
        if (textNodes[i].parentNode) {
          processTextNode(textNodes[i]);
        }
      }
    }
  }

  function processAllTextNodes(root) {
    const target = root || document.body;
    if (!target) return;

    const walker = document.createTreeWalker(
      target,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent || node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    // Group adjacent text nodes that form continuous words
    // (handles SPA frameworks splitting words across elements)
    const groups = groupTextNodes(nodes);
    processGroupBatch(groups, 0);
  }

  function processGroupBatch(groups, index) {
    var BATCH_SIZE = 200;
    var end = Math.min(index + BATCH_SIZE, groups.length);

    for (var i = index; i < end; i++) {
      var group = groups[i];
      if (group.length === 1) {
        processTextNode(group[0]);
      } else {
        processTextNodeGroup(group);
      }
    }

    if (end < groups.length) {
      requestIdleCallback(function () { processGroupBatch(groups, end); });
    }
  }

  // ── Restore Original Text ─────────────────────
  function restoreAll() {
    var spans = document.querySelectorAll('span[data-anchor-original]');
    spans.forEach(function (span) {
      var original = span.getAttribute('data-anchor-original');
      var textNode = document.createTextNode(original);
      span.parentNode.replaceChild(textNode, span);
    });
  }

  // ── MutationObserver for dynamic content ────────
  var observer = null;
  var debounceTimer = null;
  var reprocessTimer = null;
  var sweepTimer = null;
  var sweepCount = 0;
  var MAX_SWEEPS = 10;       // Run safety sweep ~10 times (10 seconds total)
  var SWEEP_INTERVAL = 1000;  // Check every 1 second

  // ── Safety Sweep: catch SPA-re-rendered text that Observer missed ──
  // Some frameworks (React, Vue) replace entire DOM subtrees on hydration,
  // which can leave text nodes unprocessed if the MutationObserver batch
  // missed them during rapid successive mutations.
  function startSafetySweep() {
    stopSafetySweep();
    sweepCount = 0;

    sweepTimer = setInterval(function () {
      sweepCount++;
      if (sweepCount > MAX_SWEEPS) {
        stopSafetySweep();
        return;
      }

      // Only sweep if page still looks active
      if (!document.body) { stopSafetySweep(); return; }

      // Find text nodes that are NOT inside a data-anchor-original span
      // and NOT inside skip tags — these are "leaked" unprocessed nodes
      var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            // Skip empty
            if (!node.textContent || node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
            // Skip if already processed (inside our span)
            if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return NodeFilter.FILTER_REJECT;
            // Skip if in a forbidden tag
            if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
            // Skip if too short to matter (pure whitespace/punctuation)
            if (node.textContent.trim().length < 3) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      var leakedNodes = [];
      while (walker.nextNode()) {
        leakedNodes.push(walker.currentNode);
        // Limit per sweep to avoid performance hit
        if (leakedNodes.length >= 100) break;
      }

      if (leakedNodes.length > 0) {
        var groups = groupTextNodes(leakedNodes);
        processGroupBatch(groups, 0);
      }
    }, SWEEP_INTERVAL);
  }

  function stopSafetySweep() {
    if (sweepTimer) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
    sweepCount = 0;
  }

  function startObserving() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var nodesToProcess = [];

        for (var m = 0; m < mutations.length; m++) {
          var mutation = mutations[m];

          // Case 1: New nodes added to DOM
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function (node) {
              // Skip nodes that are our own processed spans
              if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute && node.hasAttribute('data-anchor-original')) return;
              if (node.nodeType === Node.TEXT_NODE) {
                nodesToProcess.push(node);
              } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
                var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
                  acceptNode: function (n) {
                    // Skip text nodes inside already-processed spans
                    if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                  }
                });
                while (walker.nextNode()) {
                  nodesToProcess.push(walker.currentNode);
                }
              }
            });
          }

          // Case 2: Existing text node content changed (SPA frameworks)
          if (mutation.type === 'characterData') {
            var targetNode = mutation.target;
            if (targetNode.nodeType !== Node.TEXT_NODE) continue;

            var parent = targetNode.parentNode;
            if (!parent) continue;

            // If inside an anchor span → restore & re-process
            if (parent.hasAttribute && parent.hasAttribute('data-anchor-original')) {
              var anchorSpan = parent;
              var currentText = anchorSpan.textContent;
              var textNodeNew = document.createTextNode(currentText);
              anchorSpan.parentNode.replaceChild(textNodeNew, anchorSpan);
              nodesToProcess.push(textNodeNew);
            } else if (!parent.hasAttribute || !parent.hasAttribute('data-anchor-original')) {
              // Standalone text node changed (not yet processed)
              nodesToProcess.push(targetNode);
            }
          }
        }

        // Deduplicate, group split-words, and process
        var seen = new Set();
        var unique = [];
        nodesToProcess.forEach(function (node) {
          if (!seen.has(node) && node.parentNode) {
            seen.add(node);
            unique.push(node);
          }
        });
        var groups = groupTextNodes(unique);
        for (var g = 0; g < groups.length; g++) {
          if (groups[g].length === 1) {
            processTextNode(groups[g][0]);
          } else {
            processTextNodeGroup(groups[g]);
          }
        }
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,       // <── FIX: listen for textContent changes
      characterDataOldValue: false,
    });
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
    clearTimeout(reprocessTimer);
    stopSafetySweep();
  }

  // ── SPA Routing Hook ─────────────────────────
  function hookSpaRouting() {
    var origPushState    = history.pushState;
    var origReplaceState = history.replaceState;

    function onSpaRouteChange() {
      clearTimeout(reprocessTimer);
      reprocessTimer = setTimeout(function () {
        restoreAll();
        processAllTextNodes(document.body);
        // Restart safety sweep for the new page content
        startSafetySweep();
      }, 800);
    }

    history.pushState = function () {
      var result = origPushState.apply(this, arguments);
      onSpaRouteChange();
      return result;
    };

    history.replaceState = function () {
      var result = origReplaceState.apply(this, arguments);
      onSpaRouteChange();
      return result;
    };

    window.addEventListener('popstate',  function () { onSpaRouteChange(); });
    window.addEventListener('hashchange', function () { onSpaRouteChange(); });
  }

  // ── Message Handler (from popup / background) ─────────
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'enable') {
      processAllTextNodes(document.body);
      startObserving();
      startSafetySweep();
      sendResponse({ ok: true });
      return true;
    } else if (message.action === 'disable') {
      stopObserving();
      restoreAll();
      sendResponse({ ok: true });
    } else if (message.action === 'ping') {
      sendResponse({ ok: true });
    }
    return true;
  });

  // ── Copy Fix ─────────────────────────────────
  // When users copy text, strip our <b> wrapper so they get clean plain text.
  document.addEventListener('copy', function (e) {
    // Only act if we have processed spans on the page
    if (!document.querySelector('span[data-anchor-original]')) return;

    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    var range = sel.getRangeAt(0);
    var container = range.cloneContents();

    // Walk the cloned selection and replace anchor spans with their original text
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        return n.hasAttribute('data-anchor-original') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    var toReplace = [];
    while (walker.nextNode()) toReplace.push(walker.currentNode);

    if (toReplace.length === 0) return; // no anchor spans in selection, let default copy happen

    toReplace.forEach(function (span) {
      var text = span.getAttribute('data-anchor-original');
      var textNode = document.createTextNode(text);
      span.parentNode.replaceChild(textNode, span);
    });

    // Replace clipboard with cleaned content
    e.clipboardData.setData('text/plain', container.textContent);
    e.preventDefault();
  });

  // ── Auto-enable on injection ─────────────────────
  function init() {
    // Hook SPA routing first to detect page navigations
    hookSpaRouting();

    chrome.storage.local.get(['enabled', 'siteBlacklist'], function (result) {
      if (!result.enabled) return;

      // Check if current site is blacklisted
      var blacklist = result.siteBlacklist || [];
      var hostname = '';
      try { hostname = window.location.hostname; } catch (e) {}
      if (blacklist.indexOf(hostname) !== -1) return; // site is blacklisted

      var doEnable = function () {
        processAllTextNodes(document.body);
        startObserving();
        startSafetySweep();
      };
      if (document.body) {
        doEnable();
      } else {
        document.addEventListener('DOMContentLoaded', doEnable);
      }
    });
  }

  init();
})();
