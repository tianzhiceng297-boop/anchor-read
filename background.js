/**
 * AnchorRead - Background Service Worker
 * Manages content script state coordination,
 * keyboard shortcut handling, and per-site blacklist.
 */

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(['enabled'], function (result) {
    var updates = {};
    if (result.enabled === undefined) updates.enabled = false;
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

// ── Keyboard Shortcut Command ─────────────
chrome.commands.onCommand.addListener(function (command) {
  if (command !== 'toggle-anchor') return;

  chrome.storage.local.get(['enabled', 'siteBlacklist'], function (result) {
    var enabled = !(result.enabled || false);
    var blacklist = result.siteBlacklist || [];

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      // Check if current site is blacklisted
      var hostname = '';
      try { hostname = new URL(tabs[0].url).hostname; } catch (e) {}
      var isBlacklisted = blacklist.indexOf(hostname) !== -1;

      if (isBlacklisted && enabled) {
        // Remove from blacklist when user explicitly enables via shortcut
        var idx = blacklist.indexOf(hostname);
        blacklist.splice(idx, 1);
        chrome.storage.local.set({ siteBlacklist: blacklist });
      }

      chrome.storage.local.set({ enabled: enabled });
      sendToTab(tabs[0].id, enabled ? 'enable' : 'disable');
    });
  });
});

// ── Message Handler ────────────────────────
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
    sendToTab(tabs[0].id, action);
  });
}

function sendToTab(tabId, action) {
  chrome.tabs.sendMessage(tabId, { action: action }, function (response) {
    if (chrome.runtime.lastError) {
      setTimeout(function () {
        chrome.tabs.sendMessage(tabId, { action: action });
      }, 500);
    }
  });
}

// ── Tab Update: re-enable on navigation ────
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['enabled', 'siteBlacklist'], function (result) {
      if (!result.enabled) return;

      var blacklist = result.siteBlacklist || [];
      chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError || !tab || !tab.url) return;
        var hostname = '';
        try { hostname = new URL(tab.url).hostname; } catch (e) {}
        if (blacklist.indexOf(hostname) !== -1) return; // blacklisted

        setTimeout(function () {
          sendToTab(tabId, 'enable');
        }, 500);
      });
    });
  }
});
