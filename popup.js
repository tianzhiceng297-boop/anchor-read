/**
 * AnchorRead - Popup Script
 * Manages the toggle switch, detects if content script is active,
 * and handles PDF page detection.
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

  // ── PDF Detection ──────────────────────────
  function isPDFUrl(url) {
    if (!url) return false;
    // Direct .pdf links
    if (/\.pdf$/i.test(url)) return true;
    // Chrome PDF viewer URL patterns
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

  // PDF open button handler
  pdfOpenBtn.addEventListener('click', function () {
    detectPDF(function (isPdf, pdfUrl) {
      if (!isPdf || !pdfUrl) return;

      var viewerUrl;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        // Remote PDF: pass URL so viewer can try to fetch it
        viewerUrl = chrome.runtime.getURL('pdf-viewer.html') + '?url=' + encodeURIComponent(pdfUrl);
      } else {
        // Local file (file://): can't fetch, viewer shows drop zone
        viewerUrl = chrome.runtime.getURL('pdf-viewer.html');
      }

      chrome.tabs.create({ url: viewerUrl });
      window.close();
    });
  });

  // ── Content script alive check ─────────────
  function checkContentScript(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        callback(false);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function (response) {
        if (chrome.runtime.lastError || !response) {
          callback(false);
        } else {
          callback(true);
        }
      });
    });
  }

  // ── Init ───────────────────────────────────
  var pdfHint = document.getElementById('pdfHint');

  detectPDF(function (isPdf, pdfUrl) {
    if (isPdf) {
      // PDF mode: hide normal UI, show PDF section
      toggleRow.style.display = 'none';
      statusText.style.display = 'none';
      refreshHint.classList.remove('visible');
      pdfSection.style.display = 'block';

      if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
        pdfHint.innerHTML = 'AnchorRead can&apos;t run inside Chrome&apos;s built-in PDF viewer.<br>Click above to open this PDF in a text-friendly viewer.';
      } else {
        pdfHint.innerHTML = 'Local files can&apos;t be loaded automatically.<br>Click above, then drag the PDF into the viewer page.';
      }
    } else {
      // Normal mode
      pdfSection.style.display = 'none';

      // Load saved state
      chrome.storage.local.get(['enabled'], function (result) {
        var enabled = result.enabled || false;
        toggle.checked = enabled;
        updateUI(enabled);

        checkContentScript(function (alive) {
          if (!alive && enabled) {
            refreshHint.classList.add('visible');
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

  // Click on toggle row
  toggleRow.addEventListener('click', function (e) {
    if (e.target === toggle || (e.target.tagName === 'SPAN' && e.target.classList.contains('toggle-slider'))) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
  });

  // Refresh link click
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
