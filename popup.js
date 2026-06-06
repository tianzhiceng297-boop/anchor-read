/**
 * AnchorRead - Popup Script
 * Manages toggle, PDF detection, and per-site blacklist.
 */
(function () {
  'use strict';

  var toggle = document.getElementById('toggle');
  var statusHint = document.getElementById('statusHint');
  var statusText = document.getElementById('statusText');
  var toggleRow = document.getElementById('toggleRow');
  var refreshHint = document.getElementById('refreshHint');
  var refreshLink = document.getElementById('refreshLink');
  var pdfSection = document.getElementById('pdfSection');
  var pdfOpenBtn = document.getElementById('pdfOpenBtn');
  var blacklistBtn = document.getElementById('blacklistBtn');

  var currentHostname = '';

  // ── PDF Detection ──────────────────────────
  function isPDFUrl(url) {
    if (!url) return false;
    if (/\.pdf$/i.test(url)) return true;
    if (url.startsWith('chrome-extension://') && url.indexOf('.pdf') !== -1) return true;
    if (url.startsWith('file://') && /\.pdf$/i.test(url.split('?')[0])) return true;
    return false;
  }

  function detectPDF(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { callback(false, null); return; }
      var isPdf = isPDFUrl(tabs[0].url);
      callback(isPdf, isPdf ? tabs[0].url : null);
    });
  }

  // ── Get current tab hostname ──────────────
  function getCurrentHostname(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].url) { callback(''); return; }
      try {
        callback(new URL(tabs[0].url).hostname);
      } catch (e) {
        callback('');
      }
    });
  }

  // ── PDF open button handler ───────────────
  pdfOpenBtn.addEventListener('click', function () {
    detectPDF(function (isPdf, pdfUrl) {
      if (!isPdf || !pdfUrl) return;

      var viewerUrl;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        viewerUrl = chrome.runtime.getURL('pdf-viewer.html') + '?url=' + encodeURIComponent(pdfUrl);
      } else {
        viewerUrl = chrome.runtime.getURL('pdf-viewer.html');
      }

      chrome.tabs.create({ url: viewerUrl });
      window.close();
    });
  });

  // ── Content script alive check ─────────────
  function checkContentScript(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { callback(false); return; }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function (response) {
        callback(!chrome.runtime.lastError && response);
      });
    });
  }

  // ── Blacklist Button Handler ──────────────
  blacklistBtn.addEventListener('click', function () {
    if (!currentHostname) return;

    chrome.storage.local.get(['siteBlacklist'], function (result) {
      var blacklist = result.siteBlacklist || [];
      var idx = blacklist.indexOf(currentHostname);

      if (idx !== -1) {
        // Currently blacklisted → remove (enable for this site)
        blacklist.splice(idx, 1);
        blacklistBtn.textContent = 'Disable for this site';
        blacklistBtn.classList.remove('is-blacklisted');
      } else {
        // Not blacklisted → add (disable for this site)
        blacklist.push(currentHostname);
        blacklistBtn.textContent = 'Enable for this site';
        blacklistBtn.classList.add('is-blacklisted');

        // Send disable to current tab
        checkContentScript(function (alive) {
          if (alive) sendToggleMessage(false);
        });
      }

      chrome.storage.local.set({ siteBlacklist: blacklist });
    });
  });

  // ── Init ───────────────────────────────────
  var pdfHint = document.getElementById('pdfHint');

  detectPDF(function (isPdf, pdfUrl) {
    if (isPdf) {
      // PDF mode: hide normal UI, show PDF section
      toggleRow.style.display = 'none';
      statusText.style.display = 'none';
      refreshHint.classList.remove('visible');
      pdfSection.style.display = 'block';
      blacklistBtn.style.display = 'none';

      if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
        pdfHint.innerHTML = 'AnchorRead can&apos;t run inside Chrome&apos;s built-in PDF viewer.<br>Click above to open this PDF in a text-friendly viewer.';
      } else {
        pdfHint.innerHTML = 'Local files can&apos;t be loaded automatically.<br>Click above, then drag the PDF into the viewer page.';
      }
    } else {
      // Normal mode
      pdfSection.style.display = 'none';

      getCurrentHostname(function (hostname) {
        currentHostname = hostname;

        chrome.storage.local.get(['enabled', 'siteBlacklist'], function (result) {
          var enabled = result.enabled || false;
          var blacklist = result.siteBlacklist || [];
          var isBlacklisted = blacklist.indexOf(hostname) !== -1;

          // Show blacklist button if we have a valid hostname
          if (hostname && hostname !== 'chrome' && hostname !== 'chrome-extension') {
            blacklistBtn.style.display = 'block';
            if (isBlacklisted) {
              blacklistBtn.textContent = 'Enable for this site';
              blacklistBtn.classList.add('is-blacklisted');
            } else {
              blacklistBtn.textContent = 'Disable for this site';
              blacklistBtn.classList.remove('is-blacklisted');
            }
          }

          toggle.checked = enabled && !isBlacklisted;
          updateUI(enabled && !isBlacklisted);

          if (enabled && !isBlacklisted) {
            checkContentScript(function (alive) {
              if (!alive) refreshHint.classList.add('visible');
            });
          }
        });
      });
    }
  });

  // ── Toggle change handler ──────────────────
  toggle.addEventListener('change', function () {
    var enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateUI(enabled);

    checkContentScript(function (alive) {
      if (alive) {
        refreshHint.classList.remove('visible');
        sendToggleMessage(enabled);
      } else {
        refreshHint.classList.add('visible');
      }
    });
  });

  toggleRow.addEventListener('click', function (e) {
    if (e.target === toggle || (e.target.tagName === 'SPAN' && e.target.classList.contains('toggle-slider'))) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
  });

  refreshLink.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        window.close();
      }
    });
  });

  // ── Helpers ────────────────────────────────
  function updateUI(enabled) {
    if (enabled) {
      statusHint.textContent = 'Active on this page';
      statusText.textContent = 'Fixation mode enabled';
    } else {
      statusHint.textContent = 'Tap to enable';
      statusText.textContent = 'Inactive';
    }
  }

  function sendToggleMessage(enabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: enabled ? 'enable' : 'disable' });
      }
    });
  }
})();
