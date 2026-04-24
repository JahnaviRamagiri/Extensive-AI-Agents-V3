chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "toggle-painter" });
  } catch (err) {
    // If the content script is not loaded, inject it manually
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content.css"]
    });
    // Try sending the message again after injection
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: "toggle-painter" });
    }, 100);
  }
});
