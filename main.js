document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Erstbegehung"];
  const filters = {
    VonJahr: document.getElementById("filterVonJahr"),
    BisJahr: document.getElementById("filterBisJahr"),
    Wer: document.getElementById("filterWer")
  };

  const tableWrapper = document.getElementById("tabelle-wrapper");
  const loadingSpinner = document.getElementById("loading-spinner");

  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  loadFilters();

  Object.entries(filters).forEach(([key, el]) => {
    if (el && el.tagName === "SELECT") {
      el.addEventListener("change", () => {
        loadFilters();
        fetchData();
      });
    }
  });

  filters.Wer.addEventListener("input", () => {
    clearTimeout(window._werTimeout);
    window._werTimeout = setTimeout(() => {
      fetchData();
      loadFilters();
    }, 500);
  });

  function getFilterParams() {
    const params = new URLSearchParams();

    filterFields.forEach(field => {
      if (field !== excludeField) {
        const val = filters[field].value;
        if (val) params.append(field.toLowerCase(), val);
      }
    });

    const von = filters.VonJahr.value;
    const bis = filters.BisJahr.value;
    const wer = filters.Wer.value;

    if (excludeField !== "Jahr") {
      if (von) params.append("von", von);
      if (bis) params.append("bis", bis);
    }
    if (excludeField !== "Wer" && wer) {
      params.append("wer", wer);
    }

    
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, el]) => {
    const value = el.value;
    if (value) {
      const paramName = key.toLowerCase();
      params.append(paramName, value);
    }
  });

  return params;
}
