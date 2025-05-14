
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");
  const loadingSpinner = document.getElementById("loading-spinner"); // Lade-Spinner

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

  // Function to get the parameters for the filter API query
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

  // Fetch filter options and populate the dropdowns
  function loadFilters() {
    filterFields.forEach(field => {
      const select = filters[field];
      const currentValue = select ? select.value : '';
      const params = getFilterParams(field);
      const url = `${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          select.innerHTML = '<option value="">' + field + ' filtern...</option>';
          data.forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            if (val === currentValue) opt.selected = true;
            select.appendChild(opt);
          });
        })
        .catch(err => {
          console.error("Fehler beim Laden der Werte für", field, err);
        });
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
  }

  // Render the table with the fetched data
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
          <th>DatabaseID</th>
          <th>Gipfel</th>
          <th>Datum</th>
          <th>Wer</th>
          <th>Route</th>
          <th>Notiz</th>
          <th>Jahr</th>
          <th>Buch</th>
          <th>Erstbegehung</th>
        </tr>
        <tr>
          ${["DatabaseID", "Gipfel", "Datum", "Wer", "Route", "Notiz", "Jahr", "Buch", "Erstbegehung"]
            .map((col, index) => `<th><input type="text" data-col="${index}" placeholder="Suche..." style="width: 95%; font-size: 0.75rem;" /></th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${data.map(e => `
          <tr>
            <td>${e.Database_ || ""}</td>
            <td>${e.Gipfel || ""}</td>
            <td>${e.Datum_JMT || ""}</td>
            <td>${e.Wer || ""}</td>
            <td>${e.Route || ""}</td>
            <td>${e.Notiz || ""}</td>
            <td>${e.Jahr || ""}</td>
            <td>${e.Buch || ""}</td>
            <td>${e.Erstbegehung || ""}</td>
          </tr>`).join("")}
      </tbody>
    `;
        <tr>
          <th>DatabaseID</th>
		  <th>Gipfel</th>
          <th>Datum</th>
          <th>Wer</th>
          <th>Route</th>
          <th>Notiz</th>
          <th>Jahr</th>
          <th>Buch</th>
          <th>Erstbegehung</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(e => `
          <tr>
            <td>${e.Database_ || ""}</td>
			<td>${e.Gipfel || ""}</td>
            <td>${e.Datum_JMT || ""}</td>
            <td>${e.Wer || ""}</td>
            <td>${e.Route || ""}</td>
            <td>${e.Notiz || ""}</td>
            <td>${e.Jahr || ""}</td>
            <td>${e.Buch || ""}</td>
            <td>${e.Erstbegehung || ""}</td>
          </tr>`).join("")}
      </tbody>
    `;
    tableWrapper.appendChild(table);

    setTimeout(() => {
      window.myDataTable = new simpleDatatables.DataTable("#gipfeltabelle", {
        perPage: 10,
        perPageSelect: [10, 20, 50, 100],
        labels: {
          placeholder: "Suchen...",
          perPage: "Einträge pro Seite",
          noRows: "Keine Einträge gefunden",
          info: "Zeige {start} bis {end} von {rows} Einträgen"
        }
      });
    }, 100);

// Live-Suche je Spalte
    document.querySelectorAll("#gipfeltabelle thead input").forEach(input => {
      input.addEventListener("keyup", function () {
        const colIndex = this.getAttribute("data-col");
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll("#gipfeltabelle tbody tr");

        rows.forEach(row => {
          const cell = row.cells[colIndex];
          if (!cell) return;

          const text = cell.textContent.toLowerCase();
          row.style.display = text.includes(filter) ? "" : "none";
        });
      });
    });
  }

  document.getElementById("loading").style.display = "none";
  tableWrapper.style.display = "block";

  // Reset button functionality (reload the page)
  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    location.reload(); // Reload the page, effectively resetting everything
  });

  // Show and hide loading spinner
  function showLoadingSpinner() {
    loadingSpinner.style.display = "flex"; // Spinner anzeigen
  }

  function hideLoadingSpinner() {
    loadingSpinner.style.display = "none"; // Spinner ausblenden
  }
});
