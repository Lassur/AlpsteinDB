// --- Konstanten & globale Variablen ---
const API_BASE = "https://alpsteindb.onrender.com/api";
let chart, saisonChart, routeChart, top10Chart;

// --- Hilfsfunktionen ---
function buildUrl(params, type = "jahr") {
  const qs = new URLSearchParams(params);
  return API_BASE + "/chart/" + type + "?" + qs.toString();
}

async function fetchDropdownWerte(feld, filter = {}) {
  const params = new URLSearchParams({ feld, ...filter });
  const res = await fetch(API_BASE + "/werte?" + params.toString());
  return res.json();
}

function getAktuelleFilter() {
  const felder = {
    Gipfel: "gipfel",
    Route: "route",
    Buch: "buch",
    Buchtyp: "buchtyp",
    Erfasste_Jahre: "erfasste_jahre"
  };

  const filter = {};
  Object.entries(felder).forEach(([feld, key]) => {
    const el = document.getElementById("filter" + feld);
    const val = el?.value;
    if (val) filter[key] = val;
  });

  const von = document.getElementById("filterVonJahr")?.value;
  const bis = document.getElementById("filterBisJahr")?.value;
  if (von) filter.von = von;
  if (bis) filter.bis = bis;
  return filter;
}

// --- Diagramm-Funktionen ---
async function fetchAndRenderChart(filters) {
  const res = await fetch(buildUrl(filters, "jahr"), { headers: { Authorization: 'Bearer ' + localStorage.getItem('alpstein_token') } });
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
  const res = await fetch(buildUrl(filters, "monate"), {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('alpstein_token') }
  });
  const data = await res.json();

  const MONATSNAMEN = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const statischeReferenz = [0.26, 0.18, 0.20, 0.56, 5.75, 14.41, 21.92, 24.15, 17.76, 12.55, 1.87, 0.39];

  const labels = data.map(d => MONATSNAMEN[d.monat - 1]);
  const werte = data.map(d => d.count);
  const gesamt = werte.reduce((sum, w) => sum + w, 0);
  const werteProzent = werte.map(w => +(w / gesamt * 100).toFixed(2));
  const referenzWerte = data.map(d => statischeReferenz[d.monat - 1]);
  const maxProzent = Math.ceil(Math.max(...werteProzent, ...referenzWerte));

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Einträge (gemäss Filter)",
          data: werte,
          backgroundColor: "#2196f3",
          yAxisID: 'y',
          order: 2
        },
        {
          label: "Referenz Alpstein - alle Gipfel und kompletten Jahre (%)",
          data: referenzWerte,
          type: "line",
          borderColor: "#FF5722",
          backgroundColor: "rgba(255,87,34,0.2)",
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const index = ctx.dataIndex;
              if (ctx.dataset.label === "Einträge (gemäss Filter)") {
                return ` ${werte[index]} Einträge (${werteProzent[index]}%)`;
              }
              if (ctx.dataset.label === "Referenz Alpstein - alle Gipfel und kompletten Jahre (%)") {
                return ` Referenz: ${ctx.raw}%`;
              }
              return false;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true }
        },
        y: {
          title: { display: true, text: "Anzahl Einträge" },
          position: "left",
          beginAtZero: true
        },
        y1: {
          title: { display: true, text: "In % von Total" },
          position: "right",
          grid: { drawOnChartArea: false },
          beginAtZero: true,
          max: maxProzent,
          ticks: {
            callback: function(value) {
              return value + "%";
            }
          }
        }
      }
    }
  };

  if (saisonChart) saisonChart.destroy();
  saisonChart = new Chart(document.getElementById("saisonChart"), config);
}

async function fetchAndRenderRouteChart(filters) {
  const res = await fetch(buildUrl(filters, "route"), { headers: { Authorization: 'Bearer ' + localStorage.getItem('alpstein_token') } });
  const data = await res.json();

  const labels = data.map(d => d.route);
  const werte = data.map(d => d.count);
  const prozente = data.map(d => d.prozent + "%");

  const colors = labels.map((_, i) => {
    return `hsl(${(i * 360) / labels.length}, 60%, 60%)`;
  });

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

async function fetchAndRenderTop10Chart(filters) {
  try {
    const res = await fetch(buildUrl(filters, "top10tage_v2"), { headers: { Authorization: 'Bearer ' + localStorage.getItem('alpstein_token') } });
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
    top10Chart = new Chart(document.getElementById("top10Chart"), config);
  } catch (error) {
    console.error("Fehler beim Top10 Chart:", error);
  }
}

// --- Dropdown-Aktualisierung ---
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
    if (id === "filterVonJahr" || id === "filterBisJahr") {
      const filterCopy = { ...primaryFilters };
      const werte = await fetchDropdownWerte("Jahr", filterCopy);
      const elVon = document.getElementById("filterVonJahr");
      const elBis = document.getElementById("filterBisJahr");
      const vonAlt = elVon?.value;
      const bisAlt = elBis?.value;

      elVon.innerHTML = "<option value=''>Von Jahr</option>";
      elBis.innerHTML = "<option value=''>Bis Jahr</option>";

      werte.sort((a, b) => a - b).forEach(j => {
        const optVon = document.createElement("option");
        const optBis = document.createElement("option");
        optVon.value = optBis.value = j;
        optVon.textContent = optBis.textContent = j;
        elVon.appendChild(optVon);
        elBis.appendChild(optBis);
      });

      if (werte.includes(parseInt(vonAlt))) elVon.value = vonAlt;
      if (werte.includes(parseInt(bisAlt))) elBis.value = bisAlt;
      continue;
    }

    if (skipGipfel && id === "filterGipfel") continue;
    const el = document.getElementById(id);
    if (!el) continue;
    const filterCopy = { ...primaryFilters };
    if (feldname !== "Gipfel") filterCopy.gipfel = primaryFilters.gipfel;
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
}

// --- Initialisierung ---
async function initialisieren() {
  const spinner = document.getElementById("loading-spinner");
  spinner.style.display = "flex";

  try {
    const gipfelWerte = await fetchDropdownWerte("Gipfel");
    const gipfelSelect = document.getElementById("filterGipfel");
    gipfelSelect.innerHTML = "";
    gipfelWerte.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w;
      opt.textContent = w;
      gipfelSelect.appendChild(opt);
    });

    if (gipfelWerte.length > 0) {
      gipfelSelect.selectedIndex = 0;
    }

    let filters = getAktuelleFilter();
    if (!filters.gipfel && gipfelSelect.value) {
      filters.gipfel = gipfelSelect.value;
    }

    await updateDropdowns(filters, true);
    await fetchAndRenderChart(filters);
    await fetchAndRenderSaisonChart(filters);
    await fetchAndRenderRouteChart(filters);
    await fetchAndRenderTop10Chart(filters);
  } catch (e) {
    console.error("Initialisierungsfehler:", e);
  } finally {
    spinner.style.display = "none";
  }
}

// --- Event-Handling ---
document.addEventListener("DOMContentLoaded", () => {
  initialisieren();

  document.querySelectorAll(".filter-container select").forEach(sel => {
    sel.addEventListener("change", () => {
      const filter = getAktuelleFilter();
      const id = sel.id;

      const skipUpdateDropdowns = (id === "filterVonJahr" || id === "filterBisJahr");

      const renderCharts = () => Promise.all([
        fetchAndRenderChart(filter),
        fetchAndRenderSaisonChart(filter),
        fetchAndRenderRouteChart(filter),
        fetchAndRenderTop10Chart(filter)
      ]);

      if (skipUpdateDropdowns) {
        renderCharts();
      } else {
        updateDropdowns(filter, true).then(renderCharts);
      }
    });
  });
});

function resetFilters() {
  window.location.reload();
}
