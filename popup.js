/**
 * AnchorRead - Popup Script
 * Manages the toggle switch, detects if content script is active.
 */

(function () {
  'use strict';

  const toggle = document.getElementById('toggle');
  const statusHint = document.getElementById('statusHint');
  const statusText = document.getElementById('statusText');
  const toggleRow = document.getElementById('toggleRow');
  const refreshHint = document.getElementById('refreshHint');
  const refreshLink = document.getElementById('refreshLink');

  // Check if content script is alive on current tab
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

  // Load saved state
  chrome.storage.local.get(['enabled'], function (result) {
    const enabled = result.enabled || false;
    toggle.checked = enabled;
    updateUI(enabled);

    // Check if content script is injected; show refresh hint if not
    checkContentScript(function (alive) {
      if (!alive && enabled) {
        refreshHint.classList.add('visible');
      }
    });
  });

  // Toggle change handler
  toggle.addEventListener('change', function () {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateUI(enabled);

    // Ping content script first; if not alive, show refresh hint
    checkContentScript(function (alive) {
      if (alive) {
        refreshHint.classList.remove('visible');
        sendToggleMessage(enabled);
      } else {
        refreshHint.classList.add('visible');
      }
    });
  });

  // Also allow clicking the row
  toggleRow.addEventListener('click', function (e) {
    if (e.target === toggle || (e.target.tagName === 'SPAN' && e.target.classList.contains('toggle-slider'))) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
  });

  // Refresh link click handler
  refreshLink.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        window.close(); // close popup after refresh
      }
    });
  });

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
