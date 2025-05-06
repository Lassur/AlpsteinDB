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

  const labels = data.map(d => "Monat " + d.monat);
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
    filterJahr: "Jahr"
  };

  for (const [id, feldname] of Object.entries(felder)) {
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

function getAktuelleFilter() {
  const felder = {
    Gipfel: "gipfel",
    Route: "route",
    Buch: "buch",
    Buchtyp: "buchtyp",
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
        renderTop10TageChart(filter);
      }
    });
  });
});

async function renderTop10TageChart(filters) {
  try {
    const params = new URLSearchParams(filters || {});
    const res = await fetch(API_BASE + "/top10tage?" + params.toString());
    if (!res.ok) throw new Error("Fehler beim Laden: " + res.status);
    const data = await res.json();

    const labels = data.map(e => e.tag);
    const counts = data.map(e => e.count);

    const ctx = document.getElementById("top10tageChart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Anzahl Einträge",
          data: counts,
          backgroundColor: "#3e95cd"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Top 10 Tage mit den meisten Einträgen"
          }
        },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { beginAtZero: true }
        }
      }
    });
  } catch (err) {
    console.error("Top10Tage Fehler:", err);
  }
}