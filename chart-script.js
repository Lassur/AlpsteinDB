
let chartYear, chartMonth, chartRoute, chartTopDays;

function filterData() {
  const filters = getFilterValues();
  return window.gipfelData.filter(entry => {
    return (!filters.gipfel || entry.Gipfel === filters.gipfel)
        && (!filters.route || entry.Route === filters.route)
        && (!filters.buch || entry.Buch === filters.buch)
        && (!filters.buchtyp || entry.Buchtyp === filters.buchtyp)
        && (!filters.erfasst || entry['Erfasste Jahre'] === filters.erfasst)
        && (!filters.jahr || String(entry.Jahr) === filters.jahr)
        && (!filters.monat || String(entry.Monat).padStart(2, '0') === filters.monat);
  });
}

function getFilterValues() {
  return {
    gipfel: document.getElementById("gipfelFilter")?.value || "",
    route: document.getElementById("routeFilter")?.value || "",
    buch: document.getElementById("buchFilter")?.value || "",
    buchtyp: document.getElementById("buchtypFilter")?.value || "",
    erfasst: document.getElementById("erfasstFilter")?.value || "",
    jahr: document.getElementById("jahrFilter")?.value || "",
    monat: document.getElementById("monatFilter")?.value || ""
  };
}

function updateYearChart(data) {
  const counts = {};
  data.forEach(entry => {
    if (entry.Jahr) counts[entry.Jahr] = (counts[entry.Jahr] || 0) + 1;
  });
  const labels = Object.keys(counts).sort();
  const values = labels.map(y => counts[y]);

  if (chartYear) chartYear.destroy();
  chartYear = new Chart(document.getElementById("yearChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Einträge", data: values }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function updateMonthChart(data) {
  const counts = Array(12).fill(0);
  data.forEach(entry => {
    if (entry.Monat) counts[entry.Monat - 1]++;
  });

  if (chartMonth) chartMonth.destroy();
  chartMonth = new Chart(document.getElementById("monthChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: ["01","02","03","04","05","06","07","08","09","10","11","12"],
      datasets: [{ label: "Einträge", data: counts }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function updateRouteChart(data) {
  const counts = {};
  data.forEach(entry => {
    if (entry.Route) counts[entry.Route] = (counts[entry.Route] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(x => x[0]);
  const values = sorted.map(x => x[1]);

  if (chartRoute) chartRoute.destroy();
  chartRoute = new Chart(document.getElementById("routeChart").getContext("2d"), {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{ label: "Einträge", data: values }]
    },
    options: { responsive: true }
  });
}

function updateTopDayChart(data) {
  const counts = {};
  data.forEach(entry => {
    if (entry.Datum_JMT) {
      const date = new Date(entry.Datum_JMT);
      const day = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][date.getDay()];
      const label = `${entry.Datum_JMT} (${day})`;
      counts[label] = (counts[label] || 0) + 1;
    }
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10);
  const labels = sorted.map(x => x[0]);
  const values = sorted.map(x => x[1]);

  if (chartTopDays) chartTopDays.destroy();
  chartTopDays = new Chart(document.getElementById("topdayChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Einträge", data: values }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function updateDependentFilters() {
  // optional: intelligente Filteroptionen
}

function updateAllCharts() {
  const filtered = filterData();
  updateYearChart(filtered);
  updateMonthChart(filtered);
  updateRouteChart(filtered);
  updateTopDayChart(filtered);
  updateDependentFilters();
}
