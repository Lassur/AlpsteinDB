
// chart-script.js Inhalt (verkürzt für diesen Zweck)
let chartYear, chartMonth, chartRoute, chartTopDays;

function updateAllCharts() {
  const filtered = filterData();
  updateYearChart(filtered);
  updateMonthChart(filtered);
  updateRouteChart(filtered);
  updateTopDayChart(filtered);
  updateDependentFilters();
}

function updateTopDayChart(data) {
  const counts = {};
  data.forEach(entry => {
    if (entry.Datum_JMT) {
      const date = new Date(entry.Datum_JMT);
      const dayName = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][date.getDay()];
      const label = `${entry.Datum_JMT} (${dayName})`;
      counts[label] = (counts[label] || 0) + 1;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(x => x[0]);
  const values = sorted.map(x => x[1]);

  if (chartTopDays) chartTopDays.destroy();
  const ctx = document.getElementById("topdayChart").getContext("2d");
  chartTopDays = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Einträge",
        data: values,
        backgroundColor: "rgba(255, 159, 64, 0.6)"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
