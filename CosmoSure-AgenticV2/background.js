// background.js — opens CosmoSure Agent V2 as a full browser tab
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("CosmoSure Agent V2 installed.");
});
