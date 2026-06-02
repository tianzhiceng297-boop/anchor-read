/**
 * AnchorRead - Popup Script
 * Manages the toggle switch + bold ratio slider, communicates with content script.
 */

(function () {
  'use strict';

  const toggle = document.getElementById('toggle');
  const statusHint = document.getElementById('statusHint');
  const statusText = document.getElementById('statusText');
  const toggleRow = document.getElementById('toggleRow');
  const sliderSection = document.getElementById('sliderSection');
  const boldRatio = document.getElementById('boldRatio');
  const sliderValue = document.getElementById('sliderValue');

  // Load saved state
  chrome.storage.local.get(['enabled', 'boldRatio'], function (result) {
    const enabled = result.enabled || false;
    const ratio = result.boldRatio || 50;
    toggle.checked = enabled;
    boldRatio.value = ratio;
    sliderValue.textContent = ratio + '%';
    updateUI(enabled);
    sliderSection.classList.toggle('visible', enabled);
  });

  // Toggle change handler
  toggle.addEventListener('change', function () {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateUI(enabled);
    sliderSection.classList.toggle('visible', enabled);
    sendToggleMessage(enabled);
  });

  // Also allow clicking the row
  toggleRow.addEventListener('click', function (e) {
    if (e.target === toggle || (e.target.tagName === 'SPAN' && e.target.classList.contains('toggle-slider'))) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
  });

  // Bold ratio slider
  boldRatio.addEventListener('input', function () {
    const val = parseInt(boldRatio.value, 10);
    sliderValue.textContent = val + '%';
    chrome.storage.local.set({ boldRatio: val });
    // If enabled, re-send enable to re-process with new ratio
    if (toggle.checked) {
      sendReEnable();
    }
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

  function sendReEnable() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'reprocess' });
      }
    });
  }
})();
