/**
 * AnchorRead - Content Script
 * Converts page text by bolding the first portion of each word,
 * using the Fixation Boundary Table algorithm with adjustable bold ratio.
 * Algorithm verified against text-vide's reverse-subtraction strategy.
 */

(function () {
  'use strict';

  // Avoid double injection
  if (window.__anchorReadInjected) return;
  window.__anchorReadInjected = true;

  // ── Fixation Boundary Table ───────────────────
  // Index = number of characters NOT bolded (trailing, unbolded).
  // Word length <= boundary value → that index = trailing unbolded count.
  // Verified against text-vide's reverse-subtraction strategy.
  const FIXATION_BOUNDARIES = [0, 4, 12, 17, 24, 29, 35, 42, 48];

  /**
   * Core algorithm (reverse-subtraction, text-vide verified).
   *
   * Instead of scaling the bolded length directly, we scale the
   * UNBOLDED (trailing) length, then subtract from word length.
   *
   *   boldLen = len - unboldScaled
   *
   * This ensures the fixation landing zone (trailing chars) is
   * never bolded regardless of ratio.
   *
   * boldRatio: 0.1 (10%) → very little bold, many trailing unbolded
   *             0.5 (50%) → default, matches boundary table
   *             0.9 (90%) → almost entire word bolded
   */
  function getBoldLength(word, boldRatio) {
    const len = word.length;
    if (len <= 1) return 0;

    // Step 1: lookup base unbolded length from boundary table.
    // Index i = number of trailing characters that should NOT be bolded.
    let unboldBase = 0;
    for (let i = 0; i < FIXATION_BOUNDARIES.length; i++) {
      if (len <= FIXATION_BOUNDARIES[i]) {
        unboldBase = i;
        break;
      }
    }
    // Word longer than table: use last index as base
    if (unboldBase === 0 && len > FIXATION_BOUNDARIES[FIXATION_BOUNDARIES.length - 1]) {
      unboldBase = FIXATION_BOUNDARIES.length - 1;
    }

    // Step 2: scale the UNBOLDED length.
    // boldRatio=0.5 → scaleFactor=1 → unboldScaled = unboldBase (default)
    // boldRatio<0.5 → less bold (more trailing unbolded)
    // boldRatio>0.5 → more bold (less trailing unbolded)
    const scaleFactor = boldRatio / 0.5;
    const unboldScaled = Math.max(1, Math.round(unboldBase / scaleFactor));

    // Step 3: reverse subtraction
    const boldLen = len - unboldScaled;

    // Final clamp: bold at least 1 char, never the entire word
    return Math.max(1, Math.min(boldLen, len - 1));
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
  // FIX: always read fresh boldRatio from storage inside the observer callback,
  // so slider changes take effect for dynamically loaded content.
  let observer = null;
  let debounceTimer = null;

  function startObserving() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        // Read fresh ratio from storage on every batch
        chrome.storage.local.get('boldRatio', function (result) {
          const ratio = ((result.boldRatio || 50) / 100);
          for (const mutation of mutations) {
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
        const ratio = ((result.boldRatio || 50) / 100);
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
        const ratio = ((result.boldRatio || 50) / 100);
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
        const ratio = ((result.boldRatio || 50) / 100);
        const doEnable = function () {
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
