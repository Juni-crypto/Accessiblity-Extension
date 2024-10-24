// contentScript.js

function injectScript(filePath, callback) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath);
  script.onload = function() {
    if (callback) callback();
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

injectScript('libs/axe.min.js', function() {
  injectScript('injectedScript.js');
});

window.addEventListener('message', function(event) {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'FROM_PAGE') {
    const results = event.data.results;
    chrome.runtime.sendMessage({ type: 'axeResults', results: results });
  }
});

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
  } else if (message.type === 'runAxe') {
    axe.run().then(function(results) {
      window.postMessage({ type: 'FROM_PAGE', results: results }, '*');
      sendResponse({ results });
    }).catch(function(err) {
      console.error('axe.run error:', err);
      sendResponse({ error: err });
    });
    return true;
  }
});
