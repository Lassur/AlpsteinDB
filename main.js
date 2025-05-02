document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const suchfeld = document.getElementById("volltextsuche");
  const tableWrapper = document.getElementById("tabelle-wrapper");

  // Initialisiere Dropdowns
  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
    filters[field].addEventListener("change", () => {
      console.log("⚙️ Filter geändert:", field, filters[field].value);
      loadFilters();
      fetchData();
    });
  });

  if (suchfeld) {
    suchfeld.addEventListener("input", () => {
      fetchData();
      loadFilters();
    });
  }

  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      if (field !== excludeField) {
        const val = filters[field].value;
        if (val) params.append(field.toLowerCase(), val);
      }
    });
    const suchwert = suchfeld?.value?.trim();
    if (suchwert) params.append("suchbegriff", suchwert);
    return params;
  }

  function fetchData() {
    const params = getFilterParams();
    const url = `${apiUrl}/eintraege?${params.toString()}`;
    console.log("📡 API-Aufruf:", url);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log("📦 Gefundene Einträge:", data.length);
        renderNewTable(data);
      })
      .catch(err => {
        console.error("❌ Fehler beim Laden der Daten:", err);
      });
  }

  function loadFilters() {
    filterFields.forEach(field => {
      const select = filters[field];
      const currentValue = select.value;
      const params = getFilterParams(field);
      const url = `${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          select.innerHTML = '<option value="">'+field+' filtern...</option>';
          data.forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            if (val === currentValue) opt.selected = true;
            select.appendChild(opt);
          });
        })
        .catch(err => {
          console.error("❌ Fehler beim Laden der Werte für", field, err);
        });
    });
  }

  function renderNewTable(data) {
    if (window.myDataTable) {
      window.myDataTable.destroy();
      window.myDataTable = null;
    }

    const oldTable = document.getElementById("gipfeltabelle");
    if (oldTable) oldTable.remove();

    const table = document.createElement("table");
    table.id = "gipfeltabelle";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Gipfel</th>
          <th>Datum</th>
          <th>Wer</th>
          <th>Route</th>
          <th>Notiz</th>
          <th>Jahr</th>
          <th>Buch</th>
          <th>Erstbegehung</th>
        </tr>
