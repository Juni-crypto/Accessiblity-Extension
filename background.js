// background.js

let cachedResults = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAxeResults') {
    if (cachedResults) {
      sendResponse({ results: cachedResults });
    } else {
      runAxeAnalysis((results) => {
        cachedResults = results;
        sendResponse({ results });
      });
    }
    return true;
  } else if (message.type === 'axeResults') {
    cachedResults = message.results;
  } else if (message.type === 'refreshAxeAnalysis') {
    cachedResults = null;
    runAxeAnalysis((results) => {
      cachedResults = results;
      sendResponse({ success: true });
    });
    return true;
  }
});

function runAxeAnalysis(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'runAxe' }, (response) => {
      if (response && response.results) {
        callback(response.results);
      } else {
        callback(null);
      }
    });
  });
}
