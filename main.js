document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Erstbegehung", "Notiz"];
  const filters = {
    VonJahr: document.getElementById("filterVonJahr"),
    BisJahr: document.getElementById("filterBisJahr"),
    Wer: document.getElementById("filterWer"),
    Notiz: document.getElementById("filterNotiz")
  };

  filterFields.forEach(field => {
    const el = document.getElementById("filter" + field);
    filters[field] = el;
  });

  filters.Wer?.addEventListener("input", () => {
    clearTimeout(window._werTimeout);
    window._werTimeout = setTimeout(() => {
      fetchDataIfFiltersSet();
      loadFilters();
    }, 500);
  });

  filters.Notiz?.addEventListener("input", () => {
    clearTimeout(window._notizTimeout);
    window._notizTimeout = setTimeout(() => {
      fetchDataIfFiltersSet();
      loadFilters();
    }, 500);
  });

  function isAnyFilterSet() {
    return Object.values(filters).some(el => el?.value);
  }

  function fetchDataIfFiltersSet() {
    if (isAnyFilterSet()) {
      fetchData();
    }
  }

  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      const el = filters[field];
      if (field !== excludeField && el?.value) {
        params.append(field.toLowerCase(), el.value);
      }
    });

    const von = filters.VonJahr?.value;
    const bis = filters.BisJahr?.value;
    const wer = filters.Wer?.value;
    const notiz = filters.Notiz?.value;

    if (excludeField !== "Jahr") {
      if (von) params.append("von", von);
      if (bis) params.append("bis", bis);
    }
    if (excludeField !== "Wer" && wer) {
      params.append("wer", wer);
    }
    if (excludeField !== "Notiz" && notiz) {
      params.append("notiz", notiz);
    }

    return params;
  }

  function fetchData() {
    const params = getFilterParams();
    params.append("limit", "50000");
    const url = `${apiUrl}/eintraege?${params.toString()}`;

    const token = localStorage.getItem("alpstein_token");

    fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log("Daten geladen:", data.length);
    })
    .catch(err => {
      console.error("Fehler beim Datenladen:", err);
    });
  }

  document.getElementById("resetFilters").addEventListener("click", () => {
    Object.values(filters).forEach(el => {
      if (el?.tagName === "SELECT") el.selectedIndex = 0;
      if (el?.type === "text") el.value = "";
    });
  });
});