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
  async function fetchData() {
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

  // Reset button functionality (reload the page)
  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    location.reload(); // Reload the page, effectively resetting everything
  });

  // Excel export button functionality
  const excelButton = document.getElementById("exportExcel");
  excelButton.addEventListener("click", () => {
    const table = document.getElementById("gipfeltabelle");
    if (table) {
      const wb = XLSX.utils.table_to_book(table, { sheet: "Data" });

      // Add reference and date to the footer of the Excel file
      const date = new Date().toLocaleString();
      const footer = `Andreas Koller – Projekt 'AlpsteinDB', https://lassur.github.io/AlpsteinDB/ \nExportiert am: ${date}`;
      
      // Add footer as a note in the Excel file
      const ws = wb.Sheets["Data"];
      const cell = ws["A1"];
      ws["A1"] = cell ? `${cell.v}\n\n${footer}` : footer;

      XLSX.writeFile(wb, "export.xlsx");
    }
  });

  // Print button functionality
  const printButton = document.getElementById("printTable");
  printButton.addEventListener("click", () => {
    const table = document.getElementById("gipfeltabelle");
    if (table) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write("<html><head><title>Print Table</title><style>");
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        @page { size: landscape; margin: 20mm; }
      `);
      printWindow.document.write("</style></head><body>");
      printWindow.document.write(table.outerHTML);
      printWindow.document.write("<footer>Andreas Koller – Projekt 'AlpsteinDB', https://lassur.github.io/AlpsteinDB/</footer>");
      printWindow.document.write("</body></html>");
      printWindow.document.close();

      // Wait for the window to finish loading before printing
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close(); // Close the window after printing or canceling
        };
      };
    }
  });
});
