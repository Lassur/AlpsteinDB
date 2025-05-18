const felder = {
  filterGipfel: "Gipfel",
  filterRoute: "Route",
  filterBuch: "Buch",
  filterBuchtyp: "Buchtyp",
  filterErfasste_Jahre: "Erfasste_Jahre",
  filterVonJahr: "Jahr",
  filterBisJahr: "Jahr"
};

async function fetchDropdownWerte(feld, filter = {}) {
  const params = new URLSearchParams({ feld, ...filter });
  const res = await fetch("/api/werte?" + params.toString());
  return await res.json();
}

function getAktuelleFilter() {
  const filter = {};
  for (const [id, feldname] of Object.entries(felder)) {
    const el = document.getElementById(id);
    const val = el?.value;
    if (val) {
      if (id === "filterVonJahr") filter.von = val;
      else if (id === "filterBisJahr") filter.bis = val;
      else filter[feldname.toLowerCase()] = val;
    }
  }
  return filter;
}

async function updateDropdowns() {
  for (const [id, feldname] of Object.entries(felder)) {
    const el = document.getElementById(id);
    if (!el) continue;

    const { gipfel, route, buch, buchtyp, erfasste_jahre } = getAktuelleFilter();
    const filterCopy = { gipfel, route, buch, buchtyp, erfasste_jahre };

    if (id === "filterVonJahr" || id === "filterBisJahr") {
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
    } else {
      const werte = await fetchDropdownWerte(feldname, filterCopy);
      const alt = el.value;
      el.innerHTML = `<option value="">${el.options[0]?.textContent || "Bitte wählen..."}</option>`;
      werte.forEach(w => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = w;
        el.appendChild(opt);
      });
      if (werte.includes(alt)) el.value = alt;
    }
  }
}

async function updateCharts() {
  const filter = getAktuelleFilter();
  await Promise.all([
    renderChart("jahr", "jahrChart", filter),
    renderChart("monate", "saisonChart", filter),
    renderChart("route", "routeChart", filter),
    renderChart("top10tage_v2", "top10Chart", filter)
  ]);
}

async function renderChart(type, canvasId, filter) {
  const params = new URLSearchParams(filter);
  const res = await fetch(`/api/chart/${type}?` + params);
  const data = await res.json();
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type: type === "route" ? "pie" : "bar",
    data: {
      labels: data.map(d => d._id || d.datum || d.route || d.monat),
      datasets: [{
        label: "Einträge",
        data: data.map(d => d.count || (d.werte ? d.werte[0]?.count : 0)),
        backgroundColor: "#2196f3"
      }]
    },
    options: { responsive: true }
  });
}

function resetFilters() {
  document.querySelectorAll(".filter-container select").forEach(s => s.selectedIndex = 0);
  initialisieren();
}

async function initialisieren() {
  await updateDropdowns();
  await updateCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  initialisieren();
  document.querySelectorAll(".filter-container select").forEach(sel =>
    sel.addEventListener("change", () => {
      updateDropdowns().then(updateCharts);
    })
  );
});
