const API_BASE = "https://alpsteindb.onrender.com/api";
let chart, saisonChart, routeChart, top10Chart;

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

async function updateDropdowns(primaryFilters = {}, skipGipfel = false) {
  const felder = {
    filterGipfel: "Gipfel",
    filterVonJahr: "Jahr",
    filterBisJahr: "Jahr",
    filterRoute: "Route",
    filterBuch: "Buch",
    filterBuchtyp: "Buchtyp",
    filterErfasste_Jahre: "Erfasste_Jahre",
    filterJahr: "Jahr"
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

  const von = document.getElementById("filterVonJahr")?.value;
  const bis = document.getElementById("filterBisJahr")?.value;
  if (von) filter.von = von;
  if (bis) filter.bis = bis;
  return filter;
}

function resetFilters() {
  document.querySelectorAll(".filter-container select").forEach(s => s.selectedIndex = 0);
  initialisieren();
}

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
}

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
