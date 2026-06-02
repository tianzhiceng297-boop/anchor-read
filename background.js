/**
 * BionicRead - Background Service Worker
 * Manages content script injection/removal and state coordination.
 */

chrome.runtime.onInstalled.addListener(function () {
  // Set default state
  chrome.storage.local.set({ enabled: false });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'enable') {
    injectContentScript();
  } else if (message.action === 'disable') {
    removeContentScript();
  }
});

function injectContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;

    // Content script is auto-injected via manifest, just send enable message
    chrome.tabs.sendMessage(tabId, { action: 'enable' }, function (response) {
      if (chrome.runtime.lastError) {
        // Content script may not have loaded yet, try again shortly
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: 'enable' });
        }, 500);
      }
    });
  });
}

function removeContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'disable' });
  });
}

// Handle tab updates: send enable if enabled and tab navigates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get('enabled', function (result) {
      if (result.enabled) {
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: 'enable' }, function (response) {
            // Content script auto-injected by manifest; message may fail if not yet loaded
          });
        }, 500);
      }
    });
  }
});
