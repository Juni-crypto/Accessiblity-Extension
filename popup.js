// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Request results from background script
  chrome.runtime.sendMessage({ type: 'getAxeResults' }, response => {
    if (!response || !response.results) {
      // Handle error
      console.error('No results received from background script');
      return;
    }

    const results = response.results;
    const issuesContainer = document.getElementById('issues-container');
    const scoreElement = document.getElementById('accessibilityScore');
    issuesContainer.innerHTML = '';

    // If no violations, display a message and set score to 100
    if (!results.violations || results.violations.length === 0) {
      issuesContainer.innerHTML = '<p>No accessibility issues found!</p>';
      scoreElement.textContent = '100';
      renderChart(100);
      return;
    }

    // Calculate score based on impact levels
    const maxScore = 100;
    const impactWeights = {
      critical: 5,
      serious: 3,
      moderate: 2,
      minor: 1
    };
    let totalImpact = 0;
    results.violations.forEach(violation => {
      const impact = impactWeights[violation.impact] || 1;
      totalImpact += impact;
    });

    // Normalize totalImpact to maxScore
    const score = Math.max(maxScore - totalImpact, 0);
    scoreElement.textContent = score.toFixed(2);

    // Render chart
    renderChart(score);

    // Display issues
    results.violations.forEach(violation => {
      const issueDiv = document.createElement('div');
      issueDiv.classList.add('issue');

      const summary = document.createElement('div');
      summary.classList.add('issue-summary');
      summary.textContent = `${violation.help} (${violation.impact})`;

      const details = document.createElement('div');
      details.classList.add('issue-details');
      details.style.display = 'none'; // Hide details by default

      const descriptionP = document.createElement('p');
      descriptionP.classList.add('issue-description');
      descriptionP.textContent = violation.description;

      const helpP = document.createElement('p');
      helpP.classList.add('issue-help');
      helpP.innerHTML = `Help: <a href="${violation.helpUrl}" target="_blank">${violation.help}</a>`;

      details.appendChild(descriptionP);
      details.appendChild(helpP);

      // List affected nodes
      violation.nodes.forEach(node => {
        const nodeElement = document.createElement('p');
        nodeElement.classList.add('issue-element');
        nodeElement.textContent = node.html;

        const highlightButton = document.createElement('button');
        highlightButton.textContent = 'Highlight';
        highlightButton.addEventListener('click', () => {
          // Highlight the element on the page
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'highlightNode', target: node.target });
          });
        });

        details.appendChild(nodeElement);
        details.appendChild(highlightButton);
      });

      // Toggle details visibility on summary click
      summary.addEventListener('click', () => {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
      });

      issueDiv.appendChild(summary);
      issueDiv.appendChild(details);

      issuesContainer.appendChild(issueDiv);
    });
  });
});

// Function to render the chart
function renderChart(score) {
  const ctx = document.getElementById('accessibilityChart').getContext('2d');
  const data = {
    datasets: [{
      data: [score, 100 - score],
      backgroundColor: ['#4CAF50', '#F44336']
    }],
    labels: ['Accessible', 'Issues']
  };
  new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      circumference: 180,
      rotation: 270,
      cutout: '50%',
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}
