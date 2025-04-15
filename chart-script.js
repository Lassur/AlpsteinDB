
let chart;
let rawData = [];

function updateChart() {
  const gipfel = document.getElementById("gipfelFilter").value;
  const route = document.getElementById("routeFilter").value;

  const filtered = rawData.filter(entry =>
    (gipfel === "" || entry.Gipfel === gipfel) &&
    (route === "" || entry.Route === route)
  );

  const years = {};
  filtered.forEach(entry => {
    const year = entry.Jahr;
    const status = entry.Erfasste_Jahre === "Unvollständig" ? "Unvollständig" : "Komplett";
    if (!years[year]) years[year] = { "Komplett": 0, "Unvollständig": 0 };
    years[year][status]++;
  });

  const sortedYears = Object.keys(years).sort();
  const dataKomplett = sortedYears.map(y => years[y]["Komplett"]);
  const dataUnvoll = sortedYears.map(y => years[y]["Unvollständig"]);

  if (chart) chart.destroy();
  const ctx = document.getElementById("yearChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sortedYears,
      datasets: [
        {
          label: "Komplett",
          data: dataKomplett,
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          stack: 'stack1'
        },
        {
          label: "Unvollständig",
          data: dataUnvoll,
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          stack: 'stack1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { position: 'top' }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}

function updateRouteFilter() {
  const gipfel = document.getElementById("gipfelFilter").value;
  const routeFilter = document.getElementById("routeFilter");

  let relevant = rawData;
  if (gipfel) {
    relevant = rawData.filter(entry => entry.Gipfel === gipfel);
  }

  const routeSet = new Set(relevant.map(d => d.Route).filter(Boolean));
  routeFilter.innerHTML = "<option value=''>Alle</option>" +
    Array.from(routeSet).sort().map(g => `<option value="${g}">${g}</option>`).join("");
}

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    rawData = data;

    const gipfelSet = new Set(data.map(d => d.Gipfel).filter(Boolean));
    const gipfelFilter = document.getElementById("gipfelFilter");
    const routeFilter = document.getElementById("routeFilter");

    gipfelFilter.innerHTML = "<option value=''>Alle</option>" +
      Array.from(gipfelSet).sort().map(g => `<option value="${g}">${g}</option>`).join("");

    gipfelFilter.addEventListener("change", () => {
      updateRouteFilter();
      updateChart();
    });
    routeFilter.addEventListener("change", updateChart);

    updateRouteFilter();
    updateChart();
  });
