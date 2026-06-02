/**
 * AnchorRead - Content Script
 *
 * Converts page text by bolding the first portion of each word,
 * using the text-vide verified Fixation Boundary Table algorithm
 * with 5 boundary sets and linear interpolation for smooth ratio control.
 */

(function () {
  'use strict';

  // Avoid double injection
  if (window.__anchorReadInjected) return;
  window.__anchorReadInjected = true;

  // ── text-vide Verified Fixation Boundary Tables ──
  // Source: https://github.com/Gumball12/text-vide
  // HOW.md: https://github.com/Gumball12/text-vide/blob/main/HOW.md
  //
  // 5 boundary arrays, one per fixationPoint (1=most bold, 5=least bold).
  // Algorithm: findIndex first boundary >= wordLength, bold = len - index.
  // If no boundary >= wordLength, bold = len - table.length.
  const FIXATION_BOUNDARIES = [
    // fixationPoint 1 — most bold
    [0, 4, 12, 17, 24, 29, 35, 42, 48],
    // fixationPoint 2
    [1, 2, 7, 10, 13, 14, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49],
    // fixationPoint 3 — middle
    [1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49],
    // fixationPoint 4
    [0, 2, 4, 5, 6, 8, 9, 11, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48],
    // fixationPoint 5 — least bold
    [0, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 17, 19, 20, 21, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48],
  ];

  /**
   * text-vide core algorithm: reverse-subtraction.
   * boldLength = wordLength - findIndex(first boundary >= wordLength)
   * If no boundary >= wordLength: boldLength = wordLength - table.length
   */
  function calcBoldFromTable(wordLen, table) {
    const idx = table.findIndex(function (b) { return wordLen <= b; });
    if (idx === -1) {
      return wordLen - table.length;
    }
    return wordLen - idx;
  }

  /**
   * Map boldRatio (0.1~0.9) to a continuous fixationPoint (1.0~5.0),
   * then interpolate between the two nearest boundary tables.
   *
   * Slider 90% (0.9) → fixationPoint 1 (most bold)
   * Slider 50% (0.5) → fixationPoint 3 (middle)
   * Slider 10% (0.1) → fixationPoint 5 (least bold)
   */
  function getBoldLength(word, boldRatio) {
    const len = word.length;
    if (len <= 1) return 0;

    // Map ratio to continuous fixationPoint
    const fp = 1 + (0.9 - boldRatio) / 0.8 * 4;
    const lowerIdx = Math.max(0, Math.min(4, Math.floor(fp) - 1));
    const upperIdx = Math.max(0, Math.min(4, Math.ceil(fp) - 1));
    const t = fp - Math.floor(fp); // interpolation factor 0~1

    const boldLower = calcBoldFromTable(len, FIXATION_BOUNDARIES[lowerIdx]);
    const boldUpper = calcBoldFromTable(len, FIXATION_BOUNDARIES[upperIdx]);

    // Linear interpolation between the two boundary table results
    let boldLen;
    if (lowerIdx === upperIdx) {
      boldLen = boldLower;
    } else {
      boldLen = Math.round(boldLower + t * (boldUpper - boldLower));
    }

    // text-vide clamp: never negative, never the entire word
    return Math.max(0, Math.min(boldLen, len - 1));
  }

  // ── Word Regex ───────────────────────────────────
  const WORD_REGEX = /(\p{L}+[\p{L}\p{Nd}]*)/gu;

  // Tags whose content should never be touched
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
    'NOSCRIPT', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'CODE', 'PRE',
  ]);

  // ── Text Conversion ───────────────────────────────
  function convertText(text, boldRatio) {
    const matches = Array.from(text.matchAll(WORD_REGEX));
    if (matches.length === 0) return text;

    let result = '';
    let lastIdx = 0;

    for (const match of matches) {
      const word = match[0];
      const start = match.index;
      const boldLen = getBoldLength(word, boldRatio);

      result += text.slice(lastIdx, start);

      if (boldLen > 0 && boldLen < word.length) {
        result += '<b>' + word.slice(0, boldLen) + '</b>' + word.slice(boldLen);
      } else {
        result += word;
      }

      lastIdx = start + word.length;
    }

    result += text.slice(lastIdx);
    return result;
  }

  // ── DOM Processing ────────────────────────────────
  function shouldSkipNode(node) {
    let parent = node.parentElement;
    while (parent) {
      if (SKIP_TAGS.has(parent.tagName)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function processTextNode(node, boldRatio) {
    if (!node.textContent || node.textContent.trim().length === 0) return;
    if (node.parentElement && node.parentElement.hasAttribute('data-anchor-original')) return;
    if (shouldSkipNode(node)) return;

    const original = node.textContent;
    const converted = convertText(original, boldRatio);
    if (converted === original) return;

    const span = document.createElement('span');
    span.setAttribute('data-anchor-original', original);
    span.innerHTML = converted;
    node.parentNode.replaceChild(span, node);
  }

  function processAllTextNodes(root, boldRatio) {
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
    processBatch(nodes, 0, boldRatio);
  }

  function processBatch(nodes, index, boldRatio) {
    var BATCH_SIZE = 200;
    var end = Math.min(index + BATCH_SIZE, nodes.length);

    for (var i = index; i < end; i++) {
      processTextNode(nodes[i], boldRatio);
    }

    if (end < nodes.length) {
      requestIdleCallback(function () { processBatch(nodes, end, boldRatio); });
    }
  }

  // ── Restore Original Text ─────────────────────────
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

  function startObserving() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        // Read fresh ratio from storage on every batch
        chrome.storage.local.get('boldRatio', function (result) {
          var ratio = ((result.boldRatio || 50) / 100);
          for (var m = 0; m < mutations.length; m++) {
            var mutation = mutations[m];
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  processTextNode(node, ratio);
                } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
                  processAllTextNodes(node, ratio);
                }
              });
            }
          }
        });
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
  }

  // ── Message Handler (from popup / background) ─────────
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'enable') {
      chrome.storage.local.get('boldRatio', function (result) {
        var ratio = ((result.boldRatio || 50) / 100);
        processAllTextNodes(document.body, ratio);
        startObserving();
        sendResponse({ ok: true });
      });
      return true; // async
    } else if (message.action === 'disable') {
      stopObserving();
      restoreAll();
      sendResponse({ ok: true });
    } else if (message.action === 'reprocess') {
      chrome.storage.local.get('boldRatio', function (result) {
        var ratio = ((result.boldRatio || 50) / 100);
        stopObserving();
        restoreAll();
        processAllTextNodes(document.body, ratio);
        startObserving();
        sendResponse({ ok: true });
      });
      return true; // async
    } else if (message.action === 'ping') {
      sendResponse({ ok: true });
    }
    return true;
  });

  // ── Auto-enable on injection ─────────────────────
  function init() {
    chrome.storage.local.get(['enabled', 'boldRatio'], function (result) {
      if (result.enabled) {
        var ratio = ((result.boldRatio || 50) / 100);
        var doEnable = function () {
          processAllTextNodes(document.body, ratio);
          startObserving();
        };
        if (document.body) {
          doEnable();
        } else {
          document.addEventListener('DOMContentLoaded', doEnable);
        }
      }
    });
  }

  init();
})();
