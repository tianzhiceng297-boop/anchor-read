/**
 * BionicRead - Popup Script
 * Manages the toggle switch and communicates with background.js.
 */

(function () {
  'use strict';

  const toggle = document.getElementById('toggle');
  const statusHint = document.getElementById('statusHint');
  const statusText = document.getElementById('statusText');
  const toggleRow = document.getElementById('toggleRow');

  // Load saved state
  chrome.storage.local.get('enabled', function (result) {
    const enabled = result.enabled || false;
    toggle.checked = enabled;
    updateUI(enabled);
  });

  // Toggle click handler
  toggle.addEventListener('change', function () {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateUI(enabled);
    sendToggleMessage(enabled);
  });

  // Also allow clicking the row
  toggleRow.addEventListener('click', function (e) {
    if (e.target === toggle || e.target.tagName === 'SPAN' && e.target.classList.contains('toggle-slider')) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
  });

  function updateUI(enabled) {
    if (enabled) {
      statusHint.textContent = 'Active on this page';
      statusText.textContent = 'Bionic Reading enabled';
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
