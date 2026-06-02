/**
 * AnchorRead - Content Script
 *
 * Converts page text by bolding the first portion of each word,
 * using the text-vide verified Fixation Boundary Table algorithm.
 *
 * Algorithm: boldLength = wordLength - findIndex(first boundary >= wordLength)
 * Source: https://github.com/Gumball12/text-vide
 */

(function () {
  'use strict';

  // Avoid double injection
  if (window.__anchorReadInjected) return;
  window.__anchorReadInjected = true;

  // ── text-vide Verified Fixation Boundary Table ──
  // fixationPoint = 3 (middle / default), directly from text-vide source code.
  // Index = number of trailing characters that should NOT be bolded.
  // Algorithm: find first boundary >= wordLength, bold = wordLength - index.
  const BOUNDARY_TABLE = [
    1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
    31, 33, 35, 37, 39, 41, 43, 45, 47, 49,
  ];

  /**
   * text-vide core algorithm (fixationPoint=3, fixed).
   * Returns how many leading characters to bold.
   * Never bolds the entire word (max = len - 1).
   */
  function getBoldLength(word) {
    const len = word.length;
    if (len <= 1) return 0;

    const idx = BOUNDARY_TABLE.findIndex(function (b) {
      return len <= b;
    });

    // If no boundary >= wordLength, use table.length as index
    const unbolded = idx === -1 ? BOUNDARY_TABLE.length : idx;
    const boldLen = len - unbolded;

    // Clamp: at least 0, never the entire word
    return Math.max(0, Math.min(boldLen, len - 1));
  }

  // ── Word Regex ───────────────────────────────
  const WORD_REGEX = /(\p{L}+[\p{L}\p{Nd}]*)/gu;

  // Tags whose content should never be touched
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
    'NOSCRIPT', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'CODE', 'PRE',
  ]);

  // ── Text Conversion ───────────────────────────
  function convertText(text) {
    const matches = Array.from(text.matchAll(WORD_REGEX));
    if (matches.length === 0) return text;

    let result = '';
    let lastIdx = 0;

    for (const match of matches) {
      const word = match[0];
      const start = match.index;
      const boldLen = getBoldLength(word);

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

  // ── DOM Processing ────────────────────────────
  function shouldSkipNode(node) {
    let parent = node.parentElement;
    while (parent) {
      if (SKIP_TAGS.has(parent.tagName)) return true;
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
    processBatch(nodes, 0);
  }

  function processBatch(nodes, index) {
    var BATCH_SIZE = 200;
    var end = Math.min(index + BATCH_SIZE, nodes.length);

    for (var i = index; i < end; i++) {
      processTextNode(nodes[i]);
    }

    if (end < nodes.length) {
      requestIdleCallback(function () { processBatch(nodes, end); });
    }
  }

  // ── Restore Original Text ───────────────────────
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
        for (var m = 0; m < mutations.length; m++) {
          var mutation = mutations[m];
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType === Node.TEXT_NODE) {
                processTextNode(node);
              } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
                processAllTextNodes(node);
              }
            });
          }
        }
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
      processAllTextNodes(document.body);
      startObserving();
      sendResponse({ ok: true });
      return true; // async
    } else if (message.action === 'disable') {
      stopObserving();
      restoreAll();
      sendResponse({ ok: true });
    } else if (message.action === 'ping') {
      sendResponse({ ok: true });
    }
    return true;
  });

  // ── Auto-enable on injection ─────────────────────
  function init() {
    chrome.storage.local.get(['enabled'], function (result) {
      if (result.enabled) {
        var doEnable = function () {
          processAllTextNodes(document.body);
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
