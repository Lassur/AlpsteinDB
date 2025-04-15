
let chartYear, chartMonth, chartRoute;
let rawData = [];

function getFilterValues() {
  return {
    gipfel: document.getElementById("gipfelFilter").value,
    route: document.getElementById("routeFilter").value,
    buch: document.getElementById("buchFilter").value,
    buchtyp: document.getElementById("buchtypFilter").value,
    erfasst: document.getElementById("erfasstFilter").value,
    jahr: document.getElementById("jahrFilter").value,
    monat: document.getElementById("monatFilter").value
  };
}

function filterData() {
  const f = getFilterValues();
  return rawData.filter(entry =>
    (f.gipfel === "" || entry.Gipfel === f.gipfel) &&
    (f.route === "" || entry.Route === f.route) &&
    (f.buch === "" || entry.Buch === f.buch) &&
    (f.buchtyp === "" || entry.Buchtyp === f.buchtyp) &&
    (f.erfasst === "" || entry.Erfasste_Jahre === f.erfasst) &&
    (f.jahr === "" || entry.Jahr == f.jahr) &&
    (f.monat === "" || entry.Monat == f.monat)
  );
}

function updateAllCharts() {
  const filtered = filterData();
  updateYearChart(filtered);
  updateMonthChart(filtered);
  updateRouteChart(filtered);
  updateDependentFilters();
}

function updateYearChart(data) {
  const yearlyCounts = {};
  data.forEach(entry => {
    const year = entry.Jahr;
    const status = entry.Erfasste_Jahre === "Unvollständig" ? "Unvollständig" : "Komplett";
    if (!yearlyCounts[year]) yearlyCounts[year] = { "Komplett": 0, "Unvollständig": 0 };
    yearlyCounts[year][status]++;
  });

  const years = Object.keys(yearlyCounts).sort();
  const komplett = years.map(y => yearlyCounts[y]["Komplett"]);
  const unvoll = years.map(y => yearlyCounts[y]["Unvollständig"]);

  if (chartYear) chartYear.destroy();
  const ctx = document.getElementById("yearChart").getContext("2d");
  chartYear = new Chart(ctx, {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        { label: "Komplett", data: komplett, backgroundColor: "rgba(75,192,192,0.7)", stack: "stack1" },
        { label: "Unvollständig", data: unvoll, backgroundColor: "rgba(255,99,132,0.7)", stack: "stack1" }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

function updateMonthChart(data) {
  const monthly = {};
  for (let i = 1; i <= 12; i++) monthly[i] = 0;
  data.forEach(entry => { if (entry.Monat) monthly[entry.Monat]++; });

  const labels = Object.keys(monthly);
  const values = labels.map(m => monthly[m]);
  const total = values.reduce((a, b) => a + b, 0);
  const percentages = values.map(v => total ? ((v / total) * 100).toFixed(1) + "%" : "0%");

  if (chartMonth) chartMonth.destroy();
  const ctx = document.getElementById("monthChart").getContext("2d");
  chartMonth = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Einträge",
        data: values,
        backgroundColor: "rgba(153,102,255,0.6)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              const perc = percentages[context.dataIndex];
              return `${val} Einträge (${perc})`;
            }
          }
        },
        legend: { display: false }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function updateRouteChart(data) {
  const routeCounts = {};
  data.forEach(entry => {
    const route = entry.Route || "Unbekannt";
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });

  const labels = Object.keys(routeCounts).sort((a, b) => routeCounts[b] - routeCounts[a]);
  const values = labels.map(l => routeCounts[l]);
  const total = values.reduce((a, b) => a + b, 0);
  const percentages = values.map(v => total ? ((v / total) * 100).toFixed(1) + "%" : "0%");

  if (chartRoute) chartRoute.destroy();
  const ctx = document.getElementById("routeChart").getContext("2d");
  chartRoute = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels.map((l, i) => `${l} (${percentages[i]})`),
      datasets: [{
        label: "Einträge",
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${i * 40 % 360}, 60%, 60%)`)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const val = ctx.raw;
              return `${ctx.label}: ${val} Einträge`;
            }
          }
        }
      }
    }
  });
}

function updateDependentFilters() {
  const filtered = filterData();
  const keys = {
    "route": "Route",
    "buch": "Buch",
    "buchtyp": "Buchtyp",
    "erfasst": "Erfasste_Jahre",
    "jahr": "Jahr",
    "monat": "Monat"
  };

  for (const [id, field] of Object.entries(keys)) {
    const sel = document.getElementById(id + "Filter");
    const values = [...new Set(filtered.map(row => row[field]).filter(Boolean))].sort();
    const current = sel.value;
    sel.innerHTML = "<option value=''>Alle</option>" +
      values.map(v => `<option value="${v}"${v == current ? " selected" : ""}>${v}</option>`).join("");
  }
}

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    rawData = data;
    const gipfelSet = new Set(data.map(d => d.Gipfel).filter(Boolean));
    const gipfelFilter = document.getElementById("gipfelFilter");
    gipfelFilter.innerHTML = "<option value=''>Alle</option>" +
      Array.from(gipfelSet).sort().map(g => `<option value="${g}">${g}</option>`).join("");

    document.querySelectorAll("select").forEach(el =>
      el.addEventListener("change", updateAllCharts)
    );

    updateAllCharts();
  });


function saveChartAsPNG(chart, filename) {
  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";
  wrapper.style.font = "14px sans-serif";

  // Titel bestimmen
  const titleMap = {
    chartYear: "Einträge nach Jahren",
    chartMonth: "Einträge nach Saisonalität",
    chartRoute: "Einträge nach Routen",
    chartTopDays: "Top10 Tage nach Anzahl Einträge"
  };
  const chartName = Object.entries(window).find(([k,v]) => v === chart)?.[0] || "";
  const chartTitle = titleMap[chartName] || "Diagramm";

  const title = document.createElement("h2");
  title.innerText = chartTitle;
  wrapper.appendChild(title);

  // Aktive Filter auflisten
  const filters = getFilterValues();
  const activeFilters = Object.entries(filters)
    .filter(([_, val]) => val !== "")
    .map(([key, val]) => key.charAt(0).toUpperCase() + key.slice(1) + ": " + val)
    .join(" | ");
  if (activeFilters) {
    const p = document.createElement("p");
    p.innerText = "Filter: " + activeFilters;
    wrapper.appendChild(p);
  }

  // Chart-Canvas klonen
  const canvasClone = chart.canvas.cloneNode(true);
  canvasClone.width = chart.canvas.width;
  canvasClone.height = chart.canvas.height;
  const ctx = canvasClone.getContext("2d");
  ctx.drawImage(chart.canvas, 0, 0);
  wrapper.appendChild(canvasClone);

  document.body.appendChild(wrapper);
  html2canvas(wrapper).then(canvas => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    wrapper.remove();
  });
}

  const link = document.createElement('a');
  link.download = filename;
  link.href = chart.toBase64Image();
  link.click();
}

let chartTopDays;

function updateTopDayChart(data) {
  const counts = {};
  data.forEach(entry => {
    if (entry.Datum_JMT) {
      counts[entry.Datum_JMT] = (counts[entry.Datum_JMT] || 0) + 1;
    }
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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

// Aufruf in updateAllCharts ergänzen:
const _originalUpdateAllCharts = updateAllCharts;
updateAllCharts = function() {
  const filtered = filterData();
  updateYearChart(filtered);
  updateMonthChart(filtered);
  updateRouteChart(filtered);
  updateTopDayChart(filtered);
  updateDependentFilters();
}
