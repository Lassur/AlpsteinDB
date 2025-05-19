
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
