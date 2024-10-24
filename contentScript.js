// contentScript.js

// Function to inject a script into the page with a callback
function injectScript(filePath, callback) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath);
  script.onload = function() {
    if (callback) callback();
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Inject axe.min.js and then injectedScript.js after axe.min.js has loaded
injectScript('libs/axe.min.js', function() {
  injectScript('injectedScript.js');
});

// Listen for messages from the page context
window.addEventListener('message', function(event) {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'FROM_PAGE') {
    const results = event.data.results;
    // Send the results to the background script
    console.log(results)
    chrome.runtime.sendMessage({ type: 'axeResults', results: results });
  }
});

// Listen for messages to highlight elements
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'highlightNode') {
    const selectors = message.target;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.outline = '3px solid red';
        setTimeout(() => {
          element.style.outline = '';
        }, 2000);
      });
    });
  }
});
