/**
 * BionicRead - Content Script
 * Converts page text to Bionic Reading format by bolding the first portion of each word.
 */

(function () {
  'use strict';

  // Avoid double injection
  if (window.__bionicReadInjected) return;
  window.__bionicReadInjected = true;

  // ── Fixation Boundary Table ──────────────────────────────────────────
  // Each value is a word-length threshold.
  // The INDEX of the first threshold >= word length = number of chars NOT bolded at the end.
  const FIXATION_BOUNDARIES = [0, 4, 12, 17, 24, 29, 35, 42, 48];

  // Regex: match "words" (must contain >= 1 letter, may include digits)
  const WORD_REGEX = /(\p{L}|\p{Nd})*\p{L}(\p{L}|\p{Nd})*/gu;

  // Tags whose content should never be touched
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
    'NOSCRIPT', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'CODE', 'PRE',
  ]);

  // ── Fixation Length Calculation ─────────────────────────────────────
  function getFixationLength(wordLength) {
    for (let i = 0; i < FIXATION_BOUNDARIES.length; i++) {
      if (wordLength <= FIXATION_BOUNDARIES[i]) {
        return Math.max(wordLength - i, 0);
      }
    }
    return Math.max(wordLength - FIXATION_BOUNDARIES.length, 0);
  }

  // ── Word Cache ────────────────────────────────────────────────────
  const fixationCache = new Map();
  function getCachedFixationLength(word) {
    if (fixationCache.has(word)) return fixationCache.get(word);
    const len = getFixationLength(word.length);
    fixationCache.set(word, len);
    return len;
  }

  // ── Text Conversion ──────────────────────────────────────────────
  function convertText(text) {
    const matches = Array.from(text.matchAll(WORD_REGEX));
    if (matches.length === 0) return text;

    let result = '';
    let lastIdx = 0;

    for (const match of matches) {
      const word = match[0];
      const start = match.index;
      const boldLen = getCachedFixationLength(word);

      result += text.slice(lastIdx, start);

      if (boldLen > 0) {
        result += '<b>' + word.slice(0, boldLen) + '</b>' + word.slice(boldLen);
      } else {
        result += word;
      }

      lastIdx = start + word.length;
    }

    result += text.slice(lastIdx);
    return result;
  }

  // ── DOM Processing ─────────────────────────────────────────────────
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
    if (node.parentElement && node.parentElement.hasAttribute('data-bionic-original')) return;
    if (shouldSkipNode(node)) return;

    const original = node.textContent;
    const converted = convertText(original);
    if (converted === original) return;

    const span = document.createElement('span');
    span.setAttribute('data-bionic-original', original);
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
          if (node.parentElement && node.parentElement.hasAttribute('data-bionic-original')) {
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
    const BATCH_SIZE = 200;
    const end = Math.min(index + BATCH_SIZE, nodes.length);

    for (let i = index; i < end; i++) {
      processTextNode(nodes[i]);
    }

    if (end < nodes.length) {
      requestIdleCallback(function () { processBatch(nodes, end); });
    }
  }

  // ── Restore Original Text ──────────────────────────────────────────
  function restoreAll() {
    const spans = document.querySelectorAll('span[data-bionic-original]');
    spans.forEach(function (span) {
      const original = span.getAttribute('data-bionic-original');
      const textNode = document.createTextNode(original);
      span.parentNode.replaceChild(textNode, span);
    });
    fixationCache.clear();
  }

  // ── MutationObserver for dynamic content ──────────────────────────
  let observer = null;
  let debounceTimer = null;

  function startObserving() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        for (const mutation of mutations) {
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

  // ── Message Handler (from background.js) ──────────────────────────
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'enable') {
      processAllTextNodes(document.body);
      startObserving();
      sendResponse({ ok: true });
    } else if (message.action === 'disable') {
      stopObserving();
      restoreAll();
      sendResponse({ ok: true });
    } else if (message.action === 'ping') {
      sendResponse({ ok: true });
    }
    return true; // Keep message channel open for async response
  });

  // ── Auto-enable on injection ──────────────────────────────────────
  function init() {
    // Only auto-enable if explicitly enabled in storage
    chrome.storage.local.get('enabled', function (result) {
      if (result.enabled) {
        if (document.body) {
          processAllTextNodes(document.body);
          startObserving();
        } else {
          document.addEventListener('DOMContentLoaded', function () {
            processAllTextNodes(document.body);
            startObserving();
          });
        }
      }
    });
  }

  init();
})();
