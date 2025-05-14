
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");
  const resultInfo = document.getElementById("result-info"); // Element zur Anzeige der Gesamtanzahl

  // Initialize filter dropdowns
  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  // Load filter options
  loadFilters();

  // Event listener for filter changes
  filterFields.forEach(field => {
    filters[field].addEventListener("change", () => {
      loadFilters(); // Reload filter options based on current selections
      fetchData(); // Fetch and render new data based on selected filters
    });
  });

  // Funktion, um die Filter-Parameter zu holen
  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      const val = filters[field].value;
      if (field !== excludeField && val) {
        params.append(field.toLowerCase(), val);
      }
    });
    return params;
  }

  // Fetch total count of entries matching the current filter
  function fetchTotalCount() {
    const params = getFilterParams();
    const url = `${apiUrl}/eintraege-analyse?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.totalCount > 10000) {
          resultInfo.innerHTML = `Für Deinen Suchfilter sind ${data.totalCount} Einträge in der Datenbank vorhanden. Schränke gegebenenfalls die Suche per Filter weiter ein.`;
        } else {
          resultInfo.innerHTML = `Es sind insgesamt ${data.totalCount} Einträge vorhanden.`;
        }
      })
      .catch(err => {
        console.error("Fehler beim Abrufen der Gesamtanzahl:", err);
      });
  }

  // Fetch data based on selected filters
  function fetchData() {
    showLoadingSpinner(); // Spinner anzeigen
    const params = getFilterParams();
    params.append("limit", "50000");
    const url = `${apiUrl}/eintraege?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        renderNewTable(data);
        hideLoadingSpinner(); // Spinner ausblenden
      })
      .catch(err => {
        console.error("Fehler beim Datenladen:", err);
        hideLoadingSpinner(); // Spinner auch bei Fehler ausblenden
      });

    // Fetch total count of entries
    fetchTotalCount();
  }

  // Initiale Funktionsaufrufe
  fetchData(); // Daten holen, z.B. beim Laden der Seite
});
