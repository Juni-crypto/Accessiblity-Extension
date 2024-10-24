// injectedScript.js

(function() {
  if (typeof axe === 'undefined') {
    console.error('axe-core is not loaded');
    return;
  }

  axe.run().then(function(results) {
    window.postMessage({ type: 'FROM_PAGE', results: results }, '*');
  }).catch(function(err) {
    console.error('axe.run error:', err);
  });
})();
