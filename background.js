// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAxeResults') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          sendResponse({ results: null });
          return;
        }
        const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'getAxeResults' });
        sendResponse({ results: response ? response.results : null });
      } catch (error) {
        console.error('Error fetching Axe results:', error);
        sendResponse({ results: null, error: error.message });
      }
    })();
    return true; // Indicates that sendResponse will be called asynchronously
  } else if (message.type === 'highlightNode') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
          await chrome.tabs.sendMessage(tabs[0].id, message);
        }
      } catch (error) {
        console.error('Error highlighting node:', error);
      }
    })();
  }
});
