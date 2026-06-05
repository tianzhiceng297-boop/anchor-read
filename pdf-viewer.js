/**
 * AnchorRead PDF Viewer
 * v1.3.0 — Renders PDFs with pdf.js and applies AnchorRead bold formatting.
 */
(function () {
  'use strict';

  // ── DOM Elements ────────────────────────────
  var loadingEl   = document.getElementById('loading');
  var errorEl     = document.getElementById('error');
  var errorMsgEl  = document.getElementById('errorMsg');
  var contentEl   = document.getElementById('content');
  var toggleEl    = document.getElementById('toggleBold');
  var titleEl     = document.getElementById('pdfTitle');
  var pageInfoEl  = document.getElementById('pageInfo');

  // ── Enable toggle ──
  var fixationEnabled = true;

  toggleEl.addEventListener('change', function () {
    fixationEnabled = toggleEl.checked;
    if (fixationEnabled) {
      processAllTextNodes(contentEl);
    } else {
      restoreAll(contentEl);
    }
  });

  // ═══════════════════════════════════════════════
  //  AnchorRead Algorithm (same as content.js v1.2.18)
  // ═══════════════════════════════════════════════

  var FUNCTION_WORDS = new Set([
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

  var BOUNDARY_TABLE = [
    0, 1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
    31, 33, 35, 37, 39, 41, 43, 45, 47, 49,
  ];

  var LIGHT_LETTERS = new Set(['i', 'j', 'l', 'f', 't']);
  var DESCENDERS  = new Set(['g', 'j', 'p', 'q', 'y']);
  var ASCENDERS   = new Set(['b', 'd', 'f', 'h', 'k', 'l', 't']);

  var OPTICAL_BOUNDARIES = {
    'water': 4, 'develop': 5, 'icon': 3, 'computer': 5,
    'information': 4, 'available': 5, 'important': 4, 'difference': 4,
    'understand': 5, 'necessary': 4, 'beautiful': 4, 'possible': 4,
    'interest': 5, 'capital': 4, 'literal': 4, 'moment': 3,
    'number': 3, 'people': 3, 'problem': 3, 'reason': 3,
    'second': 3, 'system': 3, 'thought': 4, 'window': 3,
    'without': 4, 'work': 2, 'world': 2, 'year': 2,
  };

  var SUFFIXES = [
    'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ical', 'ally',
    'ingly', 'fully', 'lessly', 'ously', 'ically',
    'ing', 'ed', 'er', 'est', 'y', 'ly', 'ty',
    'ive', 'ous', 'ious', 'eous',
    'al', 'ial', 'ful', 'less',
    'ize', 'ise', 'ify', 'ate', 'en',
  ];

  var WORD_REGEX = /([\p{L}]+(?:[-.'\u2019][\p{L}]+)*)/gu;
  var CJK_RANGE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/;

  function findOptimalBreak(word) {
    var len = word.length;
    if (len <= 2) return len;
    if (len === 3) return 2;
    var lower = word.toLowerCase();
    if (OPTICAL_BOUNDARIES[lower] !== undefined) return OPTICAL_BOUNDARIES[lower];
    for (var s = 0; s < SUFFIXES.length; s++) {
      var suffix = SUFFIXES[s];
      if (lower.endsWith(suffix) && suffix.length < len) {
        var breakAt = len - suffix.length;
        if (breakAt >= 1 && breakAt < len && breakAt >= 2) return breakAt;
      }
    }
    for (var i = 1; i < len - 1; i++) {
      if (lower[i] === lower[i - 1] && i >= Math.floor(len / 3) && i <= Math.floor(len * 2 / 3)) {
        if (word[i] === word[i - 1]) {
          if (i - 1 >= Math.ceil(len * 0.3)) return i - 1;
          else if (i + 1 < len) return i + 1;
        }
        return i;
      }
    }
    var mid = Math.floor(len / 2);
    var leftBias = Math.max(1, Math.floor(len / 6));
    var candidate = mid - leftBias;
    if (candidate < 1) candidate = 1;
    if (candidate >= len) candidate = len - 1;
    if (LIGHT_LETTERS.has(word[candidate])) {
      var found = false;
      for (var j = candidate - 1; j >= 0; j--) {
        if (!LIGHT_LETTERS.has(word[j]) && j >= 1) { candidate = j + 1; found = true; break; }
      }
      if (!found && candidate < len - 1) candidate++;
    }
    if (candidate < len) {
      var nextCh = word[candidate];
      if (DESCENDERS.has(nextCh) || ASCENDERS.has(nextCh)) candidate++;
    }
    if (candidate < len - 1) {
      for (var k = candidate; k <= Math.min(candidate + 2, len - 1); k++) {
        if (DESCENDERS.has(word[k]) || ASCENDERS.has(word[k])) { candidate = k + 1; break; }
      }
    }
    var PLATFORM_LETTERS = new Set(['t', 'd', 'n', 'm', 'r', 's']);
    if (candidate > 1 && candidate < len) {
      if (!PLATFORM_LETTERS.has(word[candidate - 1])) {
        for (var m = candidate; m <= Math.min(candidate + 2, len - 1); m++) {
          if (PLATFORM_LETTERS.has(word[m])) { candidate = m + 1; break; }
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
    var len = word.length;
    if (len <= 1) return 0;
    var idx = BOUNDARY_TABLE.findIndex(function (b) { return len <= b; });
    var unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
    var boldLen = len - unbolded;
    var opticalBoldLen = findOptimalBreak(word);
    var deviation = Math.abs(boldLen - opticalBoldLen);
    if (deviation <= 2) boldLen = opticalBoldLen;
    var rawBoldLen = Math.max(0, Math.min(boldLen, len - 1));
    if (len <= 2) return rawBoldLen;
    if (len <= 4) return Math.max(2, rawBoldLen);
    if (len <= 6) return Math.max(3, rawBoldLen);
    var minBold = Math.max(3, Math.ceil(len * 0.35));
    return Math.max(minBold, rawBoldLen);
  }

  function convertText(text) {
    var matches = Array.from(text.matchAll(WORD_REGEX));
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
        result += '<b>' + encodeHTML(word.slice(0, boldLen)) + '</b>' + encodeHTML(word.slice(boldLen));
      } else {
        result += encodeHTML(word);
      }
      lastIdx = start + word.length;
    }
    result += text.slice(lastIdx);
    return result;
  }

  function encodeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── DOM Processing (simplified — no skip tags in our controlled page) ──
  function processAllTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.textContent || node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (var i = 0; i < nodes.length; i++) {
      processTextNode(nodes[i]);
    }
  }

  function processTextNode(node) {
    if (!node.parentNode) return;
    if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return;
    var original = node.textContent;
    var converted = convertText(original);
    if (converted === encodeHTML(original)) return;

    var span = document.createElement('span');
    span.setAttribute('data-anchor-original', original);
    span.innerHTML = converted;
    node.parentNode.replaceChild(span, node);
  }

  function restoreAll(root) {
    var spans = root.querySelectorAll('span[data-anchor-original]');
    for (var i = 0; i < spans.length; i++) {
      var original = spans[i].getAttribute('data-anchor-original');
      var textNode = document.createTextNode(original);
      spans[i].parentNode.replaceChild(textNode, spans[i]);
    }
  }

  // ═══════════════════════════════════════════════
  //  PDF Loading & Rendering
  // ═══════════════════════════════════════════════

  function getPDFUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('url') || params.get('src');
  }

  function showError(msg) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'flex';
    errorMsgEl.textContent = msg;
  }

  function renderPDF(pdfUrl) {
    // Configure pdf.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

    titleEl.textContent = decodeURIComponent(pdfUrl.split('/').pop() || 'PDF Document');

    pdfjsLib.getDocument(pdfUrl).promise.then(function (pdf) {
      var totalPages = pdf.numPages;
      pageInfoEl.textContent = totalPages + ' page' + (totalPages > 1 ? 's' : '');

      // Load all pages
      var pagePromises = [];
      for (var i = 1; i <= totalPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }

      Promise.all(pagePromises).then(function (pages) {
        loadingEl.style.display = 'none';

        // Render pages sequentially to preserve order
        var chain = Promise.resolve();
        pages.forEach(function (page, index) {
          chain = chain.then(function () {
            return renderPage(page, index + 1);
          });
        });

        chain.then(function () {
          // Apply AnchorRead after all pages are rendered
          if (fixationEnabled) {
            processAllTextNodes(contentEl);
          }
        });
      }).catch(function (err) {
        showError('Failed to render pages: ' + err.message);
      });
    }).catch(function (err) {
      if (err.name === 'UnknownErrorException' || err.message === 'fetch failed') {
        showError('Cannot load PDF. The file may be inaccessible (try opening from a local file or a CORS-enabled URL).');
      } else {
        showError('Failed to load PDF: ' + err.message);
      }
    });
  }

  function renderPage(page, pageNum) {
    // Get text content with positions
    return page.getTextContent().then(function (textContent) {
      var pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.setAttribute('data-page', pageNum);

      if (!textContent.items || textContent.items.length === 0) {
        contentEl.appendChild(pageDiv);
        return;
      }

      // Group text items into lines by Y position, then into paragraphs
      var lines = [];
      var currentLine = [];
      var lastY = null;

      for (var i = 0; i < textContent.items.length; i++) {
        var item = textContent.items[i];
        if (!item.str || item.str.trim() === '') continue;
        var y = Math.round(item.transform[5]);

        if (lastY === null) {
          lastY = y;
        } else if (Math.abs(y - lastY) > 3) {
          // New line detected
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
          lastY = y;

          // If vertical gap is large (>20px), treat as paragraph break
          if (Math.abs(y - (lines.length > 0 ? Math.round(textContent.items[0].transform[5]) : y)) > 20 && lines.length > 0) {
            // We'll handle paragraph breaks below
          }
        }

        currentLine.push({ str: item.str, x: Math.round(item.transform[4]), y: y, width: item.width, height: item.height });
      }
      if (currentLine.length > 0) lines.push(currentLine);

      // Convert lines to paragraphs (merge lines that are close together)
      var paragraphs = [];
      var currentPara = null;
      var lastLineY = null;

      for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        var lineY = line[0].y;

        if (currentPara === null) {
          currentPara = [line];
        } else if (Math.abs(lineY - lastLineY) < 20) {
          // Same paragraph — merge line
          currentPara.push(line);
        } else {
          // New paragraph
          paragraphs.push(currentPara);
          currentPara = [line];
        }
        lastLineY = lineY;
      }
      if (currentPara !== null) paragraphs.push(currentPara);

      // Render paragraphs into DOM
      for (var p = 0; p < paragraphs.length; p++) {
        var para = paragraphs[p];
        var paraEl = document.createElement('p');

        for (var ln = 0; ln < para.length; ln++) {
          var line = para[ln];
          // Sort by X position
          line.sort(function (a, b) { return a.x - b.x; });

          var lineText = line.map(function (item) { return item.str; }).join(' ');
          paraEl.appendChild(document.createTextNode(lineText));

          if (ln < para.length - 1) {
            paraEl.appendChild(document.createTextNode(' '));
          }
        }

        pageDiv.appendChild(paraEl);
      }

      contentEl.appendChild(pageDiv);
    });
  }

  // ═══════════════════════════════════════════════
  //  Init
  // ═══════════════════════════════════════════════

  var pdfUrl = getPDFUrl();
  if (!pdfUrl) {
    showError('No PDF URL provided. Add ?url=... to the page URL.');
  } else {
    renderPDF(pdfUrl);
  }
})();
