/**
 * AnchorRead PDF Viewer v1.3.0
 *
 * Renders PDFs with pdf.js and applies AnchorRead bold formatting.
 * Supports:
 *   - Drag-and-drop / file picker (works for local files)
 *   - Remote URL via ?url= query param (may fail if CORS blocks)
 */
(function () {
  'use strict';

  // ── DOM Elements ────────────────────────────
  var toolbarEl   = document.getElementById('toolbar');
  var loadingEl   = document.getElementById('loading');
  var dropZoneEl  = document.getElementById('dropZone');
  var dropBoxEl   = document.getElementById('dropBox');
  var dropErrorEl = document.getElementById('dropError');
  var fileInputEl = document.getElementById('fileInput');
  var contentEl   = document.getElementById('content');
  var toggleEl    = document.getElementById('toggleBold');
  var titleEl     = document.getElementById('pdfTitle');
  var pageInfoEl  = document.getElementById('pageInfo');
  var openFileBtn = document.getElementById('openFileBtn');
  var pdfjsLib    = window.pdfjsLib;

  // ── Fixation toggle ──
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
  //  AnchorRead Algorithm (mirrors content.js v1.3.0)
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
      if (DESCENDERS.has(word[candidate]) || ASCENDERS.has(word[candidate])) candidate++;
    }
    if (candidate < len - 1) {
      for (var k = candidate; k <= Math.min(candidate + 2, len - 1); k++) {
        if (DESCENDERS.has(word[k]) || ASCENDERS.has(word[k])) { candidate = k + 1; break; }
      }
    }
    var PLATFORM = new Set(['t', 'd', 'n', 'm', 'r', 's']);
    if (candidate > 1 && candidate < len) {
      if (!PLATFORM.has(word[candidate - 1])) {
        for (var m = candidate; m <= Math.min(candidate + 2, len - 1); m++) {
          if (PLATFORM.has(word[m])) { candidate = m + 1; break; }
        }
      }
    }
    if (candidate > 1 && candidate < len && word[candidate].toLowerCase() === word[candidate - 1].toLowerCase()) {
      if (candidate - 1 >= Math.ceil(len * 0.3)) candidate--;
      else if (candidate + 1 < len) candidate++;
    }
    return Math.max(1, Math.min(candidate, len - 1));
  }

  function getBoldLength(word) {
    var len = word.length;
    if (len <= 1) return 0;
    var idx = BOUNDARY_TABLE.findIndex(function (b) { return len <= b; });
    var unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
    var boldLen = len - unbolded;
    var optical = findOptimalBreak(word);
    if (Math.abs(boldLen - optical) <= 2) boldLen = optical;
    var raw = Math.max(0, Math.min(boldLen, len - 1));
    if (len <= 2) return raw;
    if (len <= 4) return Math.max(2, raw);
    if (len <= 6) return Math.max(3, raw);
    return Math.max(Math.max(3, Math.ceil(len * 0.35)), raw);
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
      if (word.indexOf('.') !== -1) { result += esc(word); lastIdx = start + word.length; continue; }
      if (CJK_RANGE.test(word)) { result += esc(word); lastIdx = start + word.length; continue; }
      if (word.length <= 2) { result += esc(word); lastIdx = start + word.length; continue; }
      var norm = word.toLowerCase().replace(/['\u2019]/g, '');
      var isFn = FUNCTION_WORDS.has(norm);
      var bl = getBoldLength(word);
      if (!isFn && bl > 0 && bl < word.length) {
        result += '<b>' + esc(word.slice(0, bl)) + '</b>' + esc(word.slice(bl));
      } else {
        result += esc(word);
      }
      lastIdx = start + word.length;
    }
    result += esc(text.slice(lastIdx));
    return result;
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── DOM Processing ──
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
    for (var i = 0; i < nodes.length; i++) processTextNode(nodes[i]);
  }

  function processTextNode(node) {
    if (!node.parentNode) return;
    if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return;
    var original = node.textContent;
    var converted = convertText(original);
    if (converted === esc(original)) return;
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

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

  function showUI() {
    loadingEl.style.display = 'none';
    dropZoneEl.classList.add('hidden');
    toolbarEl.style.display = 'flex';
  }

  function showDropZone(msg) {
    loadingEl.style.display = 'none';
    toolbarEl.style.display = 'none';
    contentEl.innerHTML = '';
    dropZoneEl.classList.remove('hidden');
    if (msg) dropErrorEl.textContent = msg;
    else dropErrorEl.textContent = '';
  }

  function showLoading(msg) {
    dropZoneEl.classList.add('hidden');
    toolbarEl.style.display = 'none';
    contentEl.innerHTML = '';
    loadingEl.style.display = 'flex';
    loadingEl.querySelector('div:last-child').textContent = msg || 'Loading PDF...';
  }

  function renderPDF(source, displayName) {
    showLoading();
    titleEl.textContent = displayName || 'PDF Document';
    contentEl.innerHTML = '';

    pdfjsLib.getDocument(source).promise.then(function (pdf) {
      var totalPages = pdf.numPages;
      pageInfoEl.textContent = totalPages + ' page' + (totalPages > 1 ? 's' : '');

      var pagePromises = [];
      for (var i = 1; i <= totalPages; i++) pagePromises.push(pdf.getPage(i));

      Promise.all(pagePromises).then(function (pages) {
        showUI();

        var chain = Promise.resolve();
        pages.forEach(function (page) {
          chain = chain.then(function () { return renderPage(page); });
        });

        chain.then(function () {
          if (fixationEnabled) processAllTextNodes(contentEl);
        });
      }).catch(function (err) {
        showDropZone('Failed to extract text: ' + err.message);
      });
    }).catch(function (err) {
      showDropZone('Failed to load PDF: ' + err.message);
    });
  }

  function renderPage(page) {
    return page.getTextContent().then(function (textContent) {
      var pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';

      if (!textContent.items || textContent.items.length === 0) {
        var p = document.createElement('p');
        p.textContent = '[No text content on this page]';
        p.style.color = '#9ca3af';
        pageDiv.appendChild(p);
        contentEl.appendChild(pageDiv);
        return;
      }

      // Build lines from positioned text items
      var lines = [];
      var currentLine = [];
      var lastY = null;
      var lineGap = null; // typical line height

      for (var i = 0; i < textContent.items.length; i++) {
        var item = textContent.items[i];
        if (!item.str || item.str.trim() === '') continue;
        var y = Math.round(item.transform[5]);

        if (lastY === null) {
          lastY = y;
        } else {
          var dy = Math.abs(y - lastY);
          if (dy > 2) {
            // new line
            if (currentLine.length > 0) {
              lines.push(currentLine);
              if (lineGap === null && lines.length >= 2) {
                var prevY = 0;
                // estimate line gap
              }
              currentLine = [];
            }
            lastY = y;
          }
        }

        currentLine.push({ str: item.str, x: Math.round(item.transform[4]) });
      }
      if (currentLine.length > 0) lines.push(currentLine);

      // Estimate typical line height to detect paragraph breaks
      var gaps = [];
      for (var l = 1; l < lines.length; l++) {
        // The Y values are baseline positions; compute gap
        // Since we saved offset, lines[l][0].y - lines[l-1][0].y gives gap
      }

      // Group lines into paragraphs based on vertical spacing
      var paragraphs = [];
      var currentPara = null;

      for (var ln = 0; ln < lines.length; ln++) {
        if (ln === 0) {
          currentPara = [lines[ln]];
          continue;
        }
        // Check if there's a significant vertical gap between consecutive lines
        // that are also at visibly different X positions (paragraph indent)
        var prevLastItem = lines[ln-1][lines[ln-1].length - 1];
        var currFirstItem = lines[ln][0];
        var xGap = Math.abs(currFirstItem.x - prevLastItem.x);

        // If line starts far right compared to where previous line ended
        // OR there's an extra blank line (we detect by position jump in list)
        // we treat as paragraph break
        if (xGap > 100 && xGap > Math.abs(lines[ln][lines[ln].length-1].x - currFirstItem.x)) {
          paragraphs.push(currentPara);
          currentPara = [lines[ln]];
        } else {
          currentPara.push(lines[ln]);
        }
      }
      if (currentPara !== null) paragraphs.push(currentPara);

      // If paragraph detection produced too many tiny chunks, fall back to all-in-one
      if (paragraphs.length > lines.length / 2) {
        paragraphs = [lines];
      }

      // Render paragraphs
      for (var p = 0; p < paragraphs.length; p++) {
        var para = paragraphs[p];
        var paraEl = document.createElement('p');

        for (var ln2 = 0; ln2 < para.length; ln2++) {
          var lineWords = para[ln2];
          // Sort by X position for reading order
          lineWords.sort(function (a, b) { return a.x - b.x; });

          // Merge adjacent words that are fragments
          var merged = [];
          for (var w = 0; w < lineWords.length; w++) {
            if (merged.length === 0) {
              merged.push(lineWords[w]);
            } else {
              var prev = merged[merged.length - 1];
              var gap = lineWords[w].x - (prev.x + prev.str.length * 7); // rough estimate
              if (gap < 10) {
                // Merge: close together in X = same word split
                prev.str += lineWords[w].str;
              } else {
                merged.push(lineWords[w]);
              }
            }
          }

          var lineText = merged.map(function (item) { return item.str; }).join(' ');
          paraEl.appendChild(document.createTextNode(lineText));
          if (ln2 < para.length - 1) paraEl.appendChild(document.createTextNode(' '));
        }

        pageDiv.appendChild(paraEl);
      }

      contentEl.appendChild(pageDiv);
    });
  }

  // ═══════════════════════════════════════════════
  //  File Drop / Select Handlers
  // ═══════════════════════════════════════════════

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      dropErrorEl.textContent = 'Please select a PDF file.';
      return;
    }
    dropErrorEl.textContent = '';
    // Pass File object directly to pdf.js
    renderPDF(file, file.name);
  }

  // Drag and drop
  dropBoxEl.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropBoxEl.classList.add('drag-over');
  });
  dropBoxEl.addEventListener('dragleave', function () {
    dropBoxEl.classList.remove('drag-over');
  });
  dropBoxEl.addEventListener('drop', function (e) {
    e.preventDefault();
    dropBoxEl.classList.remove('drag-over');
    var file = e.dataTransfer.files[0];
    handleFile(file);
  });

  // Click to select
  dropBoxEl.addEventListener('click', function () {
    fileInputEl.click();
  });
  fileInputEl.addEventListener('change', function () {
    var file = fileInputEl.files[0];
    handleFile(file);
  });

  // Toolbar "Open another" button
  openFileBtn.addEventListener('click', function () {
    contentEl.innerHTML = '';
    showDropZone();
  });

  // ═══════════════════════════════════════════════
  //  Init — try URL query param first
  // ═══════════════════════════════════════════════

  function getPDFUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('url') || params.get('src');
  }

  var pdfUrl = getPDFUrl();

  if (pdfUrl) {
    // Only attempt URL load if it's http/https (not file://)
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      var displayName = decodeURIComponent(pdfUrl.split('/').pop() || pdfUrl);
      renderPDF(pdfUrl, displayName);
    } else {
      // file:// or other protocol — can't fetch from extension, show drop zone
      showDropZone('Local file URLs cannot be loaded automatically.\nDrag the PDF here or click to select.');
    }
  } else {
    // No URL provided — just show drop zone
    showDropZone();
  }
})();
