
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

// --- Saisonchart mit Referenzdaten & Monats-Fix ---
async function fetchAndRenderSaisonChart(filters) {
  const res = await fetch(buildUrl(filters, "monate"), {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('alpstein_token') }
  });
  const rawData = await res.json();

  const MONATSNAMEN = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // Initialisiere alle Monate mit count/prozent 0
  const data = Array.from({ length: 12 }, (_, i) => ({
    monat: i + 1,
    count: 0,
    prozent: 0
  }));

  // Überschreiben, wenn Daten vorhanden
  rawData.forEach(d => {
    const index = d.monat - 1;
    data[index] = d;
  });

  const labels = MONATSNAMEN;
  const werte = data.map(d => d.count);
  const prozente = data.map(d => d.prozent + "%");

  const referenzWerte = [0.26, 0.18, 0.20, 0.56, 5.75, 14.41, 21.92, 24.15, 17.76, 12.55, 1.87, 0.39];

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Einträge",
          data: werte,
          backgroundColor: "#2196f3",
          yAxisID: 'y',
          order: 2
        },
        {
          label: "Saisonale Referenz (%)",
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
              if (ctx.datasetIndex === 0) {
                return ` ${ctx.raw} Einträge (${prozente[ctx.dataIndex]})`;
              } else {
                return ` Referenz: ${ctx.raw}%`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Monat" }
        },
        y: {
          title: { display: true, text: "Anzahl Einträge" },
          position: "left"
        },
        y1: {
          title: { display: true, text: "Saisonale Referenz (%)" },
          position: "right",
          grid: { drawOnChartArea: false },
          min: 0,
          max: 30,
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
