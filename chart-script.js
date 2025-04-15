
let chart;
let rawData = [];

function updateChart() {
  const gipfel = document.getElementById("gipfelFilter").value;
  const route = document.getElementById("routeFilter").value;

  const filtered = rawData.filter(entry =>
    (gipfel === "" || entry.Gipfel === gipfel) &&
    (route === "" || entry.Route === route)
  );

  const yearlyCounts = {};
  filtered.forEach(entry => {
    const year = entry.Jahr;
    if (!yearlyCounts[year]) yearlyCounts[year] = 0;
    yearlyCounts[year]++;
  });

  const labels = Object.keys(yearlyCounts).sort();
  const data = labels.map(year => yearlyCounts[year]);

  if (chart) chart.destroy();
  const ctx = document.getElementById("yearChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Einträge pro Jahr",
        data: data,
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    rawData = data;

    const gipfelSet = new Set(data.map(d => d.Gipfel).filter(Boolean));
    const routeSet = new Set(data.map(d => d.Route).filter(Boolean));

    const gipfelFilter = document.getElementById("gipfelFilter");
    const routeFilter = document.getElementById("routeFilter");

    gipfelFilter.innerHTML = "<option value=''>Alle</option>" +
      Array.from(gipfelSet).sort().map(g => `<option value="${g}">${g}</option>`).join("");

    routeFilter.innerHTML = "<option value=''>Alle</option>" +
      Array.from(routeSet).sort().map(g => `<option value="${g}">${g}</option>`).join("");

    gipfelFilter.addEventListener("change", updateChart);
    routeFilter.addEventListener("change", updateChart);

    updateChart();
  });
