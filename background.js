// Service worker — MV3. Ephemeral: killed after ~30s idle.
// Keep state in chrome.storage, not in memory.

const FILL_ACTION = "job-autofiller:fill";

// Click on the extension icon → run the fill flow on the active tab.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.tabs.sendMessage(tab.id, { type: FILL_ACTION }).catch(() => {
    // content script may not be injected (e.g. chrome:// pages) — ignore.
    console.debug("[job-autofiller] no content script on tab", tab.id);
  });
});
