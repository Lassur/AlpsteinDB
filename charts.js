const API_BASE = "https://alpsteindb.onrender.com/api";
let chart;

function buildUrl(params) {
  const qs = new URLSearchParams(params);
  return API_BASE + "/chart/jahr?" + qs.toString();
}

async function fetchDropdownWerte(feld, filter = {}) {
  const params = new URLSearchParams({ feld, ...filter });
  const res = await fetch(API_BASE + "/werte?" + params.toString());
  return res.json();
}

async function fetchAndRenderChart(filters) {
  const res = await fetch(buildUrl(filters));
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

async function updateDropdowns(primaryFilters = {}) {
  const felder = {
    filterGipfel: "Gipfel",
    filterRoute: "Route",
    filterBuch: "Buch",
    filterBuchtyp: "Buchtyp",
    filterErfasst: "Erfasste_Jahre",
    filterJahr: "Jahr",
    filterMonat: "Monat"
  };

  for (const [id, feldname] of Object.entries(felder)) {
    const el = document.getElementById(id);
    if (!el) continue;
    const filterCopy = { ...primaryFilters };
    if (feldname !== "Gipfel" && id !== "filterGipfel") filterCopy.gipfel = primaryFilters.gipfel;
    const werte = await fetchDropdownWerte(feldname, filterCopy);
    el.innerHTML = "<option value=''>" + el.options[0].text + "</option>";
    werte.forEach(wert => {
      const opt = document.createElement("option");
      opt.value = wert;
      opt.textContent = wert;
      el.appendChild(opt);
    });
  }
}

function getAktuelleFilter() {
  const felder = ["Gipfel", "Route", "Buch", "Buchtyp", "Erfasste_Jahre", "Jahr", "Monat"];
  const filter = {};
  felder.forEach(feld => {
    const val = document.getElementById("filter" + feld)?.value;
    if (val) filter[feld.toLowerCase()] = val;
  });
  return filter;
}

function resetFilters() {
  document.querySelectorAll(".filter-container select").forEach(s => s.selectedIndex = 0);
  initialisieren();
}

async function initialisieren() {
  const gipfel = await fetchDropdownWerte("Gipfel");
  if (!gipfel.length) return;
  const erster = gipfel[0];
  document.getElementById("filterGipfel").innerHTML = "<option value='" + erster + "'>" + erster + "</option>";
  document.getElementById("filterGipfel").value = erster;

  const filters = { gipfel: erster };
  await updateDropdowns(filters);
  await fetchAndRenderChart(filters);
}

document.addEventListener("DOMContentLoaded", () => {
  initialisieren();

  document.querySelectorAll(".filter-container select").forEach(sel => {
    sel.addEventListener("change", () => {
      const filter = getAktuelleFilter();
      if (filter.gipfel) {
        updateDropdowns(filter);
        fetchAndRenderChart(filter);
      }
    });
  });
});