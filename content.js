/**
 * AnchorRead - Content Script
 * Converts page text by bolding the first portion of each word,
 * using the Fixation Boundary Table algorithm with adjustable bold ratio.
 */

(function () {
  'use strict';

  // Avoid double injection
  if (window.__anchorReadInjected) return;
  window.__anchorReadInjected = true;

  // ── Defaults ───────────────────────────────────
  const DEFAULT_BOLD_RATIO = 0.5; // 50%
  let currentBoldRatio = DEFAULT_BOLD_RATIO;

  // ── Fixation Boundary Table ───────────────────
  // Index = number of characters NOT bolded (trailing)
  // Word length <= boundary value → use that index
  const FIXATION_BOUNDARIES = [0, 4, 12, 17, 24, 29, 35, 42, 48];

  /**
   * Core algorithm: return how many leading chars to bold.
   * Uses the fixation boundary table, then scales by boldRatio.
   *
   * Step 1: Lookup base bold length from boundary table
   * Step 2: Scale by boldRatio (0.1 ~ 0.9)
   * Step 3: Clamp to [1, wordLength - 1]
   */
  function getBoldLength(word, boldRatio) {
    const len = word.length;
    if (len <= 1) return 0;

    // Step 1: base bold length from boundary table
    let baseBold = 1;
    for (let i = 0; i < FIXATION_BOUNDARIES.length; i++) {
      if (len <= FIXATION_BOUNDARIES[i]) {
        baseBold = Math.max(len - i, 1);
        break;
      }
    }
    // Word longer than table: use len - table.length
    if (baseBold === 1 && len > FIXATION_BOUNDARIES[FIXATION_BOUNDARIES.length - 1]) {
      baseBold = len - FIXATION_BOUNDARIES.length + 1;
    }

    // Step 2: scale by boldRatio
    const scaled = Math.max(1, Math.round(baseBold * boldRatio));

    // Step 3: clamp — never bold the entire word, never bold 0
    return Math.min(scaled, len - 1);
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
    const BATCH_SIZE = 200;
    const end = Math.min(index + BATCH_SIZE, nodes.length);

    for (let i = index; i < end; i++) {
      processTextNode(nodes[i], boldRatio);
    }

    if (end < nodes.length) {
      requestIdleCallback(function () { processBatch(nodes, end, boldRatio); });
    }
  }

  // ── Restore Original Text ─────────────────────────
  function restoreAll() {
    const spans = document.querySelectorAll('span[data-anchor-original]');
    spans.forEach(function (span) {
      const original = span.getAttribute('data-anchor-original');
      const textNode = document.createTextNode(original);
      span.parentNode.replaceChild(textNode, span);
    });
  }

  // ── MutationObserver for dynamic content ────────
  let observer = null;
  let debounceTimer = null;

  function startObserving(boldRatio) {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType === Node.TEXT_NODE) {
                processTextNode(node, boldRatio);
              } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
                processAllTextNodes(node, boldRatio);
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

  // ── Message Handler (from background.js) ─────────
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'enable') {
      chrome.storage.local.get('boldRatio', function (result) {
        const ratio = ((result.boldRatio || 50) / 100);
        processAllTextNodes(document.body, ratio);
        startObserving(ratio);
        sendResponse({ ok: true });
      });
      return true; // async
    } else if (message.action === 'disable') {
      stopObserving();
      restoreAll();
      sendResponse({ ok: true });
    } else if (message.action === 'reprocess') {
      chrome.storage.local.get('boldRatio', function (result) {
        const ratio = ((result.boldRatio || 50) / 100);
        stopObserving();
        restoreAll();
        processAllTextNodes(document.body, ratio);
        startObserving(ratio);
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
        const ratio = ((result.boldRatio || 50) / 100);
        const doEnable = function () {
          processAllTextNodes(document.body, ratio);
          startObserving(ratio);
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
