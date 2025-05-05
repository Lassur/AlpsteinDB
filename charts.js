let chartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadDropdowns();

  document.getElementById('loadChartButton').addEventListener('click', loadChart);
  document.getElementById('resetButton').addEventListener('click', () => {
    document.querySelectorAll('#filterSection select').forEach(sel => sel.selectedIndex = 0);
  });
});

async function loadDropdowns() {
  const gipfelSelect = document.getElementById('gipfelSelect');
  const response = await fetch('/api/chart/dropdowns');
  const data = await response.json();

  fillSelect(gipfelSelect, data.gipfel, true);
  fillSelect(document.getElementById('routeSelect'), data.route);
  fillSelect(document.getElementById('buchSelect'), data.buch);
  fillSelect(document.getElementById('buchtypSelect'), data.buchtyp);
  fillSelect(document.getElementById('erfassteJahreSelect'), data.erfasste_jahre);
  fillSelect(document.getElementById('jahrSelect'), data.jahr);
  fillSelect(document.getElementById('monatSelect'), data.monat);
}

function fillSelect(select, options, includeEmpty = false) {
  if (includeEmpty) {
    select.innerHTML = '<option value="">Bitte wählen</option>';
  }
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

async function loadChart() {
  const gipfel = document.getElementById('gipfelSelect').value;
  if (!gipfel) {
    alert('Bitte einen Gipfel auswählen!');
    return;
  }

  const query = {
    gipfel,
    route: getValue('routeSelect'),
    buch: getValue('buchSelect'),
    buchtyp: getValue('buchtypSelect'),
    erfassteJahre: getValue('erfassteJahreSelect'),
    jahr: getValue('jahrSelect'),
    monat: getValue('monatSelect')
  };

  const response = await fetch('/api/chart/jahr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const data = await response.json();
  renderChart(data);
}

function getValue(id) {
  return document.getElementById(id).value || null;
}

function renderChart(data) {
  const labels = data.labels;
  const datasets = data.datasets;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById('eintraegeChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Einträge nach Jahren' },
        tooltip: { mode: 'index', intersect: false },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  });
}
