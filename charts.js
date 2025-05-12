
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

async function updateDropdowns(primaryFilters = {}, skipGipfel = false) {
  const felder = {
    filterGipfel: "Gipfel",
    filterRoute: "Route",
    filterBuch: "Buch",
    filterBuchtyp: "Buchtyp",
    filterErfasste_Jahre: "Erfasste_Jahre",  // Hier ist der Erfasste_Jahre-Filter
    filterJahr: "Jahr"
  };

  for (const [id, feldname] of Object.entries(felder)) {
    if (skipGipfel && id === "filterGipfel") continue;
    const el = document.getElementById(id);
    if (!el) continue;
    const filterCopy = { ...primaryFilters };
    if (feldname !== "Gipfel") filterCopy.gipfel = primaryFilters.gipfel;
    const werte = await fetchDropdownWerte(feldname, filterCopy);

    // Den aktuellen Wert speichern, bevor die Optionen aktualisiert werden
    const aktuellerWert = el.value;

    // Optionen im Dropdown löschen, aber den ersten Platzhalter beibehalten
    while (el.options.length > 0) {
      el.remove(0);
    }

    // Neue Optionen hinzufügen
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = el.options[0].text;
    el.appendChild(defaultOption);
    
    werte.forEach(wert => {
      const opt = document.createElement("option");
      opt.value = wert;
      opt.textContent = wert;
      el.appendChild(opt);
    });

    // Den aktuellen Wert wieder setzen, wenn er existiert
    if (werte.includes(aktuellerWert)) {
      el.value = aktuellerWert;
    }
  }
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

function resetFilters() {
  document.querySelectorAll(".filter-container select").forEach(s => s.selectedIndex = 0);
  initialisieren();
}

async function initialisieren() {
  const gipfelWerte = await fetchDropdownWerte("Gipfel");
  const gipfelSelect = document.getElementById("filterGipfel");
  gipfelSelect.innerHTML = "";
  gipfelWerte.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = w;
    gipfelSelect.appendChild(opt);
  });
  gipfelSelect.selectedIndex = 0;

  const filters = getAktuelleFilter();
  await updateDropdowns(filters, true);
  await fetchAndRenderChart(filters);
  await fetchAndRenderSaisonChart(filters);
  await fetchAndRenderRouteChart(filters);
  await fetchAndRenderTop10Chart(filters);
}

document.addEventListener("DOMContentLoaded", () => {
  initialisieren();

  document.querySelectorAll(".filter-container select").forEach(sel => {
    sel.addEventListener("change", () => {
      const filter = getAktuelleFilter();
      if (filter.gipfel) {
        updateDropdowns(filter, true);
        fetchAndRenderChart(filter);
        fetchAndRenderSaisonChart(filter);
        fetchAndRenderRouteChart(filter);
        fetchAndRenderTop10Chart(filter);
      }
    });
  });
});


let top10Chart;

async function fetchAndRenderTop10Chart(filters) {
  try {
    const res = await fetch(buildUrl(filters, "top10tage_v2"));
    const data = await res.json();
    const labels = data.map(d => d.datum);
    const werte = data.map(d => d.count);

    const config = {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Einträge pro Tag",
          data: werte,
          backgroundColor: "#9c27b0"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: "Datum (Wochentag)"
            }
          },
          y: {
            title: {
              display: true,
              text: "Anzahl Einträge"
            }
          }
        }
      }
    };

    if (top10Chart) top10Chart.destroy();
    const ctx = document.getElementById("top10Chart");
    if (ctx) {
      top10Chart = new Chart(ctx, config);
    }
  } catch (error) {
    console.error("Fehler beim Top10 Chart:", error);
  }
}
