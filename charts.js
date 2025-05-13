const API_BASE = "https://alpsteindb.onrender.com/api";
let chart, saisonChart, routeChart;

function buildUrl(params, type = "jahr") {
  const qs = new URLSearchParams(params);
  return API_BASE + "/chart/" + type + "?" + qs.toString();
}

async function fetchDropdownWerte(feld, filter = {}) {
  const params = new URLSearchParams({ feld, ...filter });
  const res = await fetch(API_BASE + "/werte?" + params.toString());
  return res.json();
}

// Funktion zum Abrufen der Dropdown-Werte für Jahre
async function fetchJahre(filter = {}) {
  const params = new URLSearchParams(filter);
  const res = await fetch(API_BASE + "/werte?feld=Jahr&" + params.toString());
  return res.json();
}

// Funktion, um die Jahre für die Filter "Von" und "Bis" zu aktualisieren
async function updateJahrDropdowns() {
  const filter = getAktuelleFilter();  // Hole die aktuellen Filterwerte
  const jahre = await fetchJahre(filter);

  const vonJahrSelect = document.getElementById("filterVonJahr");
  const bisJahrSelect = document.getElementById("filterBisJahr");

  vonJahrSelect.innerHTML = "<option value=''>Von Jahr</option>";
  bisJahrSelect.innerHTML = "<option value=''>Bis Jahr</option>";

  jahre.forEach(jahr => {
    const vonOption = document.createElement("option");
    vonOption.value = jahr;
    vonOption.textContent = jahr;
    vonJahrSelect.appendChild(vonOption);

    const bisOption = document.createElement("option");
    bisOption.value = jahr;
    bisOption.textContent = jahr;
    bisJahrSelect.appendChild(bisOption);
  });
}

// Diese Funktion wird aufgerufen, um alle Filter zu aktualisieren
async function updateDropdowns(primaryFilters = {}, skipGipfel = false) {
  const felder = {
    filterGipfel: "Gipfel",
    filterRoute: "Route",
    filterBuch: "Buch",
    filterBuchtyp: "Buchtyp",
    filterErfasste_Jahre: "Erfasste_Jahre",
    filterVonJahr: "Jahr",
    filterBisJahr: "Jahr"
  };

  for (const [id, feldname] of Object.entries(felder)) {
    if (skipGipfel && id === "filterGipfel") continue;
    const el = document.getElementById(id);
    if (!el) continue;
    const filterCopy = { ...primaryFilters };
    const werte = await fetchDropdownWerte(feldname, filterCopy);
    const aktuellerWert = el.value;
    el.innerHTML = "<option value=''>" + el.options[0].text + "</option>";
    werte.forEach(wert => {
      const opt = document.createElement("option");
      opt.value = wert;
      opt.textContent = wert;
      el.appendChild(opt);
    });
    if (werte.includes(isNaN(aktuellerWert) ? aktuellerWert : Number(aktuellerWert))) {
      el.value = aktuellerWert;
    }
  }

  // Nach dem Laden der anderen Dropdowns, die Jahre für "Von" und "Bis" nachladen
  await updateJahrDropdowns();
}

function getAktuelleFilter() {
  const felder = {
    Gipfel: "gipfel",
    Route: "route",
    Buch: "buch",
    Buchtyp: "buchtyp",
    Erfasste_Jahre: "erfasste_jahre",
    Jahr: "jahr"
  };

  const filter = {};
  Object.entries(felder).forEach(([feld, key]) => {
    const el = document.getElementById("filter" + feld);
    const val = el?.value;
    if (val) filter[key] = val;
  });

  return filter;
}

async function fetchAndRenderChart(filters) {
  const res = await fetch(buildUrl(filters, "jahr"));
  const data = await res.json();

  const jahre = data.map(d => d._id);
  const gruppiert = {};
  data.forEach(d => {
    d.werte.forEach(w => {
      if (!gruppiert[w.status]) gruppiert[w.status] = {};
      gruppiert[w.status][d._id] = w.count;
    });
  });

  const datasets = Object.entries(gruppiert).map(([label, werte]) => ({
    label,
    data: jahre.map(j => werte[j] || 0),
    backgroundColor: label === "Komplett" ? "#4caf50" : "#ff9800"
  }));

  const config = {
    type: "bar",
    data: { labels: jahre, datasets },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true, title: { display: true, text: "Jahr" } },
        y: { stacked: true, title: { display: true, text: "Anzahl Einträge" } }
      }
    }
  };

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("jahrChart"), config);
}

async function fetchAndRenderSaisonChart(filters) {
  const res = await fetch(buildUrl(filters, "monate"));
  const data = await res.json();

  const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const labels = data.map(d => MONATSNAMEN[d.monat - 1]);

  const werte = data.map(d => d.count);
  const prozente = data.map(d => d.prozent + "%");

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Einträge",
        data: werte,
        backgroundColor: "#2196f3"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ` ${ctx.raw} Einträge (${prozente[ctx.dataIndex]})`;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "Monat" } },
        y: { title: { display: true, text: "Anzahl Einträge" } }
      }
    }
  };

  if (saisonChart) saisonChart.destroy();
  saisonChart = new Chart(document.getElementById("saisonChart"), config);
}

async function fetchAndRenderRouteChart(filters) {
  const res = await fetch(buildUrl(filters, "route"));
  const data = await res.json();

  const labels = data.map(d => d.route);
  const werte = data.map(d => d.count);
  const prozente = data.map(d => d.prozent + "%");

  const colors = labels.map((_, i) =>
    `hsl(${(i * 360) / labels.length}, 60%, 60%)`
  );

  const config = {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Einträge nach Routen",
        data: werte,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return `${ctx.label}: ${ctx.raw} Einträge (${prozente[ctx.dataIndex]})`;
            }
          }
        }
      }
    }
  };

  if (routeChart) routeChart.destroy();
  routeChart = new Chart(document.getElementById("routeChart"), config);
}

async function updateDropdownsForFilters() {
  const filters = getAktuelleFilter();
  await updateDropdowns(filters);
  await fetchAndRenderChart(filters);
  await fetchAndRenderSaisonChart(filters);
  await fetchAndRenderRouteChart(filters);
}

document.addEventListener("DOMContentLoaded", () => {
  updateDropdownsForFilters();

  document.querySelectorAll(".filter-container select").forEach(sel => {
    sel.addEventListener("change", () => {
      updateDropdownsForFilters();
    });
  });
});
