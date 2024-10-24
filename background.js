// background.js

let axeResults = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'axeResults') {
    axeResults = message.results;
  }
});

// Provide results to the popup script when requested
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAxeResults') {
    sendResponse({ results: axeResults });
  }
});
