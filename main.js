
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");

  // Initialize filter dropdowns
  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  // Load filter options
  loadFilters();

  // Event listener for filter changes
  filterFields.forEach(field => {
    filters[field].addEventListener("change", () => {
      // After any change, we need to fetch new options for the remaining filters
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
        // Special handling for "Erstbegehung" filter values
        if (field === "Erstbegehung") {
          if (val === "Ja") {
            params.append(field.toLowerCase(), "true");  // "Ja" as true
          } else if (val === "Nein") {
            params.append(field.toLowerCase(), "false"); // "Nein" as false
          } else if (val === "Ja (Unterkategorie von Erstbegehung)") {
            params.append(field.toLowerCase(), "true_subcategory"); // Special handling for subcategory
          } else {
            params.append(field.toLowerCase(), val); // Handle any other cases
          }
        } else {
          params.append(field.toLowerCase(), val);
        }
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
    const params = getFilterParams();
    params.append("limit", "50000");
    const url = `${apiUrl}/eintraege?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        renderNewTable(data);
      })
      .catch(err => {
        console.error("Fehler beim Datenladen:", err);
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
  }

  document.getElementById("loading").style.display = "none";
  tableWrapper.style.display = "block";

  // Reset button functionality
  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    filterFields.forEach(field => {
      filters[field].value = "";
    });
    fetchData(); // Fetch data again after reset
  });
});
