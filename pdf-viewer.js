/**
 * AnchorRead PDF Viewer v1.3.0
 *
 * Renders PDFs with pdf.js and applies AnchorRead bold formatting.
 * Supports drag-and-drop / file picker for local files, and
 * remote URL via ?url= query param (http/https only).
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  //  Sanity check
  // ═══════════════════════════════════════════════
  if (typeof pdfjsLib === 'undefined') {
    document.body.innerHTML = '<div style="color:#fca5a5;text-align:center;padding:100px 20px;font-size:16px;">Failed to load pdf.js library. Please reload the extension.</div>';
    return;
  }

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
  var loadingMsg  = loadingEl.querySelector('div:last-child');

  // ── Configure worker ──
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

  // ── Fixation toggle ──
  var fixationEnabled = true;
  toggleEl.addEventListener('change', function () {
    fixationEnabled = toggleEl.checked;
    if (fixationEnabled) processAllTextNodes(contentEl);
    else restoreAll(contentEl);
  });

  // ═══════════════════════════════════════════════
  //  AnchorRead Algorithm
  // ═══════════════════════════════════════════════
  var FUNCTION_WORDS = new Set([
    'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this',
    'but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what',
    'so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know',
    'take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only',
    'come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new',
    'want','because','any','these','give','day','most','us','is','are','was','been','being','am','have','has','had',
    'having','does','did','doing','done','isnt','arent','wasnt','werent','havent','hasnt','hadnt','dont','doesnt',
    'didnt','wont','wouldnt','shouldnt','cant','couldnt','mustnt','mightnt','neednt','its','lets','thats','whats',
    'hows','wheres','whens','whys','whos','ive','youve','weve','theyve','id','youll','hell','shell','well','theyll',
    'hes','shes','theyd','wed','youre','theyre','were','im',
  ]);

  var BOUNDARY_TABLE = [0,1,2,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49];
  var LIGHT_LETTERS = new Set(['i','j','l','f','t']);
  var DESCENDERS  = new Set(['g','j','p','q','y']);
  var ASCENDERS   = new Set(['b','d','f','h','k','l','t']);
  var OPTICAL_BOUNDARIES = {
    'water':4,'develop':5,'icon':3,'computer':5,'information':4,'available':5,'important':4,
    'difference':4,'understand':5,'necessary':4,'beautiful':4,'possible':4,'interest':5,
    'capital':4,'literal':4,'moment':3,'number':3,'people':3,'problem':3,'reason':3,
    'second':3,'system':3,'thought':4,'window':3,'without':4,'work':2,'world':2,'year':2,
  };
  var SUFFIXES = ['tion','sion','ness','ment','able','ible','ical','ally','ingly','fully','lessly','ously','ically','ing','ed','er','est','y','ly','ty','ive','ous','ious','eous','al','ial','ful','less','ize','ise','ify','ate','en'];
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
    var candidate = Math.max(1, mid - Math.max(1, Math.floor(len / 6)));
    if (candidate >= len) candidate = len - 1;
    if (LIGHT_LETTERS.has(word[candidate])) {
      var found = false;
      for (var j = candidate - 1; j >= 0; j--) {
        if (!LIGHT_LETTERS.has(word[j]) && j >= 1) { candidate = j + 1; found = true; break; }
      }
      if (!found && candidate < len - 1) candidate++;
    }
    if (candidate < len && (DESCENDERS.has(word[candidate]) || ASCENDERS.has(word[candidate]))) candidate++;
    if (candidate < len - 1) {
      for (var k = candidate; k <= Math.min(candidate + 2, len - 1); k++) {
        if (DESCENDERS.has(word[k]) || ASCENDERS.has(word[k])) { candidate = k + 1; break; }
      }
    }
    var PLATFORM = new Set(['t','d','n','m','r','s']);
    if (candidate > 1 && candidate < len && !PLATFORM.has(word[candidate - 1])) {
      for (var m = candidate; m <= Math.min(candidate + 2, len - 1); m++) {
        if (PLATFORM.has(word[m])) { candidate = m + 1; break; }
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

  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function convertText(text) {
    var matches = Array.from(text.matchAll(WORD_REGEX));
    if (matches.length === 0) return text;
    var result = '', lastIdx = 0;
    for (var i = 0; i < matches.length; i++) {
      var match = matches[i];
      var word = match[0], start = match.index;
      result += esc(text.slice(lastIdx, start));
      if (word.indexOf('.') !== -1 || CJK_RANGE.test(word) || word.length <= 2) {
        result += esc(word);
      } else {
        var norm = word.toLowerCase().replace(/['\u2019]/g, '');
        var bl = getBoldLength(word);
        if (!FUNCTION_WORDS.has(norm) && bl > 0 && bl < word.length) {
          result += '<b>' + esc(word.slice(0, bl)) + '</b>' + esc(word.slice(bl));
        } else {
          result += esc(word);
        }
      }
      lastIdx = start + word.length;
    }
    result += esc(text.slice(lastIdx));
    return result;
  }

  function processAllTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node.parentNode || (node.parentElement && node.parentElement.hasAttribute('data-anchor-original'))) continue;
      var original = node.textContent;
      var converted = convertText(original);
      if (converted === esc(original)) continue;
      var span = document.createElement('span');
      span.setAttribute('data-anchor-original', original);
      span.innerHTML = converted;
      node.parentNode.replaceChild(span, node);
    }
  }

  function restoreAll(root) {
    var spans = root.querySelectorAll('span[data-anchor-original]');
    for (var i = spans.length - 1; i >= 0; i--) {
      var original = spans[i].getAttribute('data-anchor-original');
      if (original === null) continue;
      var textNode = document.createTextNode(original);
      spans[i].parentNode.replaceChild(textNode, spans[i]);
    }
  }

  // ═══════════════════════════════════════════════
  //  PDF Rendering
  // ═══════════════════════════════════════════════

  function showUI() { loadingEl.style.display = 'none'; dropZoneEl.classList.add('hidden'); toolbarEl.style.display = 'flex'; }

  function showDropZone(msg) {
    loadingEl.style.display = 'none'; toolbarEl.style.display = 'none';
    contentEl.innerHTML = ''; dropZoneEl.classList.remove('hidden');
    dropErrorEl.textContent = msg || '';
  }

  function showLoading(msg) {
    dropZoneEl.classList.add('hidden'); toolbarEl.style.display = 'none';
    contentEl.innerHTML = ''; loadingEl.style.display = 'flex';
    loadingMsg.textContent = msg || 'Loading PDF...';
  }

  function renderPDF(source, displayName) {
    showLoading('Reading PDF...');
    titleEl.textContent = displayName || 'PDF Document';
    contentEl.innerHTML = '';

    var loadingTask = pdfjsLib.getDocument(source);

    loadingTask.promise.then(function (pdf) {
      var totalPages = pdf.numPages;
      pageInfoEl.textContent = totalPages + ' page' + (totalPages > 1 ? 's' : '');

      // ── Quick check: sample first 2 pages for text ──
      var pagesToSample = Math.min(2, totalPages);
      loadingMsg.textContent = 'Checking PDF type...';

      var samplePromises = [];
      for (var i = 1; i <= pagesToSample; i++) {
        samplePromises.push(pdf.getPage(i).then(function (page) {
          return page.getTextContent().then(function (tc) {
            return tc && tc.items && tc.items.length > 0;
          });
        }));
      }

      Promise.all(samplePromises).then(function (hasTextResults) {
        var anyText = hasTextResults.some(function (r) { return r; });

        if (!anyText) {
          // Image-based PDF — stop early, show clear message
          showUI();
          var summaryDiv = document.createElement('div');
          summaryDiv.className = 'pdf-page';
          summaryDiv.innerHTML =
            '<p style="font-size:18px;color:#e5e7eb;">This PDF is image-based</p>' +
            '<p style="color:#9ca3af;margin-top:20px;line-height:1.8;">' +
            'AnchorRead cannot work with scanned or image-only PDFs.<br>' +
            'The text is stored as pictures, not as selectable characters.</p>' +
            '<p style="color:#60a5fa;margin-top:20px;font-size:14px;">What you can do:</p>' +
            '<ul style="color:#9ca3af;margin-top:8px;line-height:1.8;padding-left:20px;">' +
            '<li>Use OCR software (Adobe Acrobat, ABBYY) to convert to text PDF</li>' +
            '<li>Re-export from the original source (Word, LaTeX, Markdown)</li>' +
            '<li>Use a text-based PDF instead</li>' +
            '</ul>';
          contentEl.appendChild(summaryDiv);
          return;
        }

        // Has text — proceed with full rendering
        var emptyPageCount = 0;
        var currentPage = 1;

        function processNext() {
          if (currentPage > totalPages) {
            if (fixationEnabled) processAllTextNodes(contentEl);
            return;
          }

          loadingMsg.textContent = 'Rendering page ' + currentPage + ' of ' + totalPages + '...';

          pdf.getPage(currentPage).then(function (page) {
            return renderPage(page, currentPage, function (isEmpty) {
              if (isEmpty) emptyPageCount++;
            });
          }).then(function () {
            currentPage++;
            processNext();
          }).catch(function (err) {
            var errDiv = document.createElement('div');
            errDiv.className = 'pdf-page';
            errDiv.innerHTML = '<p style="color:#fca5a5;">Page ' + currentPage + ' error: ' + esc(err.message) + '</p>';
            contentEl.appendChild(errDiv);
            currentPage++;
            processNext();
          });
        }

        showUI();
        processNext();
      });
    }).catch(function (err) {
      var msg = err.message || String(err);
      if (msg.indexOf('InvalidPDFException') !== -1 || msg.indexOf('No PDF') !== -1) {
        showDropZone('This file does not appear to be a valid PDF.');
      } else if (msg.indexOf('PasswordException') !== -1) {
        showDropZone('This PDF is password-protected and cannot be opened.');
      } else {
        showDropZone('Failed to open PDF: ' + msg);
      }
    });
  }

  function renderPage(page, pageNum, onEmpty) {
    return page.getTextContent().then(function (textContent) {
      var pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';

      if (!textContent.items || textContent.items.length === 0) {
        if (onEmpty) onEmpty(true);
        // This PDF has no extractable text (scanned/image-based).
        // pdf.js can't OCR — show a clear message.
        var p = document.createElement('p');
        p.textContent = '[Page ' + pageNum + ': No extractable text]';
        p.style.color = '#9ca3af';
        pageDiv.appendChild(p);
        var note = document.createElement('p');
        note.textContent = 'This PDF appears to be image-based (scanned). AnchorRead can only bold text-based PDFs.';
        note.style.cssText = 'color:#9ca3af;font-size:12px;margin-top:12px;';
        pageDiv.appendChild(note);
        contentEl.appendChild(pageDiv);
        return;
      }

      if (onEmpty) onEmpty(false);

      // Build lines: group text items by Y position
      var lines = [];
      var currentLine = [];
      var lastY = null;

      for (var i = 0; i < textContent.items.length; i++) {
        var item = textContent.items[i];
        if (!item.str || item.str.trim() === '') continue;
        var y = Math.round(item.transform[5]);

        if (lastY === null) {
          lastY = y;
        } else {
          var dy = Math.abs(y - lastY);
          if (dy > 2) {
            if (currentLine.length > 0) { lines.push(currentLine); currentLine = []; }
            lastY = y;
          }
        }
        currentLine.push({ str: item.str, x: Math.round(item.transform[4]) });
      }
      if (currentLine.length > 0) lines.push(currentLine);

      // Group lines into paragraphs by significant vertical gaps
      var paragraphs = [];
      var currentPara = [];

      for (var ln = 0; ln < lines.length; ln++) {
        if (ln === 0) {
          currentPara = [lines[ln]];
          continue;
        }

        var prevFirstY = lines[ln-1][0] ? 0 : 0;
        var currFirstY = lines[ln][0] ? 0 : 0;

        // Detect paragraph break by leading space (common in PDF)
        var lineStr = lines[ln].map(function (w) { return w.str; }).join(' ');
        var isIndented = /^[\s\u00A0]{2,}/.test(lineStr);

        // Also check if line starts far to the right (indent)
        var firstX = lines[ln][0].x;
        var prevFirstX = lines[ln-1][0].x;
        var indentGap = Math.abs(firstX - prevFirstX);

        if (isIndented || indentGap > 30) {
          paragraphs.push(currentPara);
          currentPara = [lines[ln]];
        } else {
          currentPara.push(lines[ln]);
        }
      }
      if (currentPara.length > 0) paragraphs.push(currentPara);

      // If paragraph detection split too aggressively, merge
      if (paragraphs.length > lines.length / 1.5 && lines.length > 3) {
        paragraphs = [lines];
      }

      for (var p = 0; p < paragraphs.length; p++) {
        var para = paragraphs[p];
        var paraEl = document.createElement('p');
        var paraText = '';

        for (var ln2 = 0; ln2 < para.length; ln2++) {
          var words = para[ln2].slice().sort(function (a, b) { return a.x - b.x; });
          // Merge adjacent word fragments
          var merged = [];
          for (var w = 0; w < words.length; w++) {
            if (merged.length === 0) {
              merged.push(words[w]);
            } else {
              var prev = merged[merged.length - 1];
              var gap = words[w].x - (prev.x + prev.str.length * 7);
              if (gap < 10) { prev.str += words[w].str; }
              else { merged.push(words[w]); }
            }
          }
          paraText += merged.map(function (m) { return m.str; }).join(' ');
          if (ln2 < para.length - 1) paraText += ' ';
        }

        paraEl.appendChild(document.createTextNode(paraText.trim()));
        pageDiv.appendChild(paraEl);
      }

      contentEl.appendChild(pageDiv);
    });
  }

  // ═══════════════════════════════════════════════
  //  File Handling
  // ═══════════════════════════════════════════════

  function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      dropErrorEl.textContent = 'Please select a PDF file.';
      return;
    }
    dropErrorEl.textContent = '';

    // Read file into ArrayBuffer for pdf.js v2
    showLoading('Reading file...');
    var reader = new FileReader();
    reader.onload = function () {
      renderPDF(new Uint8Array(reader.result), file.name);
    };
    reader.onerror = function () {
      showDropZone('Failed to read file. It may be corrupted or inaccessible.');
    };
    reader.readAsArrayBuffer(file);
  }

  dropBoxEl.addEventListener('dragover', function (e) { e.preventDefault(); dropBoxEl.classList.add('drag-over'); });
  dropBoxEl.addEventListener('dragleave', function () { dropBoxEl.classList.remove('drag-over'); });
  dropBoxEl.addEventListener('drop', function (e) {
    e.preventDefault();
    dropBoxEl.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });
  dropBoxEl.addEventListener('click', function () { fileInputEl.click(); });
  fileInputEl.addEventListener('change', function () { handleFile(fileInputEl.files[0]); });
  openFileBtn.addEventListener('click', function () { contentEl.innerHTML = ''; showDropZone(); });

  // Allow dropping anywhere on the page
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    e.preventDefault();
    if (e.target === dropBoxEl || dropBoxEl.contains(e.target)) return; // handled by dropBox
    handleFile(e.dataTransfer.files[0]);
  });

  // ═══════════════════════════════════════════════
  //  Init
  // ═══════════════════════════════════════════════

  var params = new URLSearchParams(window.location.search);
  var pdfUrl = params.get('url') || params.get('src');

  if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
    var displayName = decodeURIComponent(pdfUrl.split('/').pop() || pdfUrl);
    renderPDF({ url: pdfUrl }, displayName);
  } else if (pdfUrl) {
    showDropZone('Local files cannot be loaded automatically.\nDrag the PDF here or click to select.');
  } else {
    showDropZone();
  }
})();
