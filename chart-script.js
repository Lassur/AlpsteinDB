
let chartYear, chartMonth;
let rawData = [];

function getFilterValues() {
  return {
    gipfel: document.getElementById("gipfelFilter").value,
    route: document.getElementById("routeFilter").value,
    buch: document.getElementById("buchFilter").value,
    buchtyp: document.getElementById("buchtypFilter").value,
    erfasst: document.getElementById("erfasstFilter").value
  };
}

function filterData() {
  const filters = getFilterValues();
  return rawData.filter(entry =>
    (filters.gipfel === "" || entry.Gipfel === filters.gipfel) &&
    (filters.route === "" || entry.Route === filters.route) &&
    (filters.buch === "" || entry.Buch === filters.buch) &&
    (filters.buchtyp === "" || entry.Buchtyp === filters.buchtyp) &&
    (filters.erfasst === "" || entry.Erfasste_Jahre === filters.erfasst)
  );
}

function updateAllCharts() {
  const filtered = filterData();
  updateYearChart(filtered);
  updateMonthChart(filtered);
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

  data.forEach(entry => {
    if (entry.Monat) monthly[entry.Monat]++;
  });

  const labels = Object.keys(monthly);
  const values = labels.map(m => monthly[m]);

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
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function updateDependentFilters() {
  const filtered = filterData();
  const keys = ["Route", "Buch", "Buchtyp", "Erfasste_Jahre"];
  keys.forEach(key => {
    const sel = document.getElementById(key.toLowerCase() + "Filter");
    const values = [...new Set(filtered.map(row => row[key]).filter(Boolean))].sort();
    const current = sel.value;
    sel.innerHTML = "<option value=''>Alle</option>" +
      values.map(v => `<option value="${v}"${v === current ? " selected" : ""}>${v}</option>`).join("");
  });
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
