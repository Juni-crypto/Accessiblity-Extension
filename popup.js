// popup.js

document.addEventListener('DOMContentLoaded', () => {
  let results = null;

  // Elements
  const issuesContainer = document.getElementById('issues-container');
  const scoreElement = document.getElementById('accessibilityScore');
  const filterContainer = document.getElementById('filter-container');
  const exportButton = document.getElementById('exportButton');
  const refreshButton = document.getElementById('refreshButton');

  // Impact weights
  const impactWeights = { critical: 5, serious: 3, moderate: 2, minor: 1 };

  // Event Listeners
  filterContainer.addEventListener('change', () => renderIssues(results.violations));
  exportButton.addEventListener('click', exportReport);
  refreshButton.addEventListener('click', refreshAnalysis);

  // Initialize
  getResults();

  function getResults() {
    chrome.runtime.sendMessage({ type: 'getAxeResults' }, (response) => {
      if (!response || !response.results) {
        displayError('No results received from background script.');
        return;
      }

      results = response.results;
      issuesContainer.innerHTML = '';

      if (!results.violations || results.violations.length === 0) {
        issuesContainer.innerHTML = '<p>No accessibility issues found!</p>';
        scoreElement.textContent = '100';
        renderChart(100);
        return;
      }

      const score = calculateScore(results.violations);
      scoreElement.textContent = score.toFixed(2);
      renderChart(score);
      renderIssues(results.violations);
    });
  }

  function calculateScore(violations) {
    const maxScore = 100;
    const totalImpact = violations.reduce((sum, violation) => {
      const impact = impactWeights[violation.impact] || 1;
      return sum + impact;
    }, 0);
    return Math.max(maxScore - totalImpact, 0);
  }

  function renderIssues(violations) {
    issuesContainer.innerHTML = '';
    const selectedImpacts = Array.from(
      document.querySelectorAll('#filter-container input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);

    const filteredViolations = violations.filter((violation) =>
      selectedImpacts.includes(violation.impact)
    );

    if (filteredViolations.length === 0) {
      issuesContainer.innerHTML = '<p>No issues match the selected filters.</p>';
      return;
    }

    const groupedViolations = filteredViolations.reduce((groups, violation) => {
      const impact = violation.impact || 'minor';
      if (!groups[impact]) groups[impact] = [];
      groups[impact].push(violation);
      return groups;
    }, {});

    const fragment = document.createDocumentFragment();

    Object.keys(groupedViolations)
      .sort((a, b) => impactWeights[b] - impactWeights[a])
      .forEach((impact) => {
        const impactHeader = document.createElement('h2');
        impactHeader.textContent = `${impact.charAt(0).toUpperCase() + impact.slice(1)} Issues`;
        fragment.appendChild(impactHeader);

        groupedViolations[impact].forEach((violation) => {
          const issueDiv = createIssueElement(violation);
          fragment.appendChild(issueDiv);
        });
      });

    issuesContainer.appendChild(fragment);
  }

  function createIssueElement(violation) {
    const issueDiv = document.createElement('div');
    issueDiv.classList.add('issue');

    const summary = document.createElement('div');
    summary.classList.add('issue-summary');
    summary.textContent = violation.help;

    const details = document.createElement('div');
    details.classList.add('issue-details');
    details.style.display = 'none';

    const descriptionP = document.createElement('p');
    descriptionP.classList.add('issue-description');
    descriptionP.textContent = violation.description;

    const helpP = document.createElement('p');
    helpP.classList.add('issue-help');
    helpP.innerHTML = `Help: <a href="${violation.helpUrl}" target="_blank">${violation.help}</a>`;

    details.appendChild(descriptionP);
    details.appendChild(helpP);

    violation.nodes.forEach((node) => {
      const nodeElement = document.createElement('p');
      nodeElement.classList.add('issue-element');
      nodeElement.textContent = node.html;

      const highlightButton = document.createElement('button');
      highlightButton.textContent = 'Highlight';
      highlightButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'highlightNode',
            target: node.target,
          });
        });
      });

      details.appendChild(nodeElement);
      details.appendChild(highlightButton);
    });

    summary.setAttribute('tabindex', '0');
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', 'false');

    summary.addEventListener('click', toggleDetails);
    summary.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDetails();
      }
    });

    function toggleDetails() {
      const isExpanded = details.style.display === 'block';
      details.style.display = isExpanded ? 'none' : 'block';
      summary.setAttribute('aria-expanded', String(!isExpanded));
    }

    issueDiv.appendChild(summary);
    issueDiv.appendChild(details);

    return issueDiv;
  }

  function renderChart(score) {
    const ctx = document.getElementById('accessibilityChart').getContext('2d');
    const data = {
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: ['#4CAF50', '#F44336'],
        },
      ],
      labels: ['Accessible', 'Issues'],
    };
    new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        circumference: 180,
        rotation: 270,
        cutout: '50%',
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  function exportReport() {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const exportLink = document.createElement('a');
    exportLink.href = url;
    exportLink.download = 'accessibility_report.json';
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
  }

  function refreshAnalysis() {
    chrome.runtime.sendMessage({ type: 'refreshAxeAnalysis' }, () => {
      getResults();
    });
  }

  function displayError(message) {
    issuesContainer.innerHTML = `<p class="error-message">${message}</p>`;
  }
});
