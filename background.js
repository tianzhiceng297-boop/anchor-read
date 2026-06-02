/**
 * AnchorRead - Background Service Worker
 * Manages content script state coordination.
 */

chrome.runtime.onInstalled.addListener(function () {
  // Only set defaults if not already configured (avoid overwriting user state on reload)
  chrome.storage.local.get(['enabled', 'boldRatio'], function (result) {
    const updates = {};
    if (result.enabled === undefined) updates.enabled = false;
    if (result.boldRatio === undefined) updates.boldRatio = 50;
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'enable') {
    sendToContent('enable');
  } else if (message.action === 'disable') {
    sendToContent('disable');
  }
  sendResponse({ ok: true });
  return false;
});

function sendToContent(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: action }, function (response) {
      if (chrome.runtime.lastError) {
        // Content script may not have loaded yet, try again shortly
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: action });
        }, 500);
      }
    });
  });
}

// Handle tab updates: re-enable if extension was enabled and tab navigates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get('enabled', function (result) {
      if (result.enabled) {
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: 'enable' }, function () {
            // Content script auto-injected by manifest; message may fail if not yet loaded
          });
        }, 500);
      }
    });
  }
});
