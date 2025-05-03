
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");

  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
    filters[field].addEventListener("change", () => {
      loadFilters();
      fetchData();
    });
  });

  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      if (field !== excludeField) {
        const val = filters[field].value;
        if (val) params.append(field.toLowerCase(), val);
      }
    });
    return params;
  }

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
          console.error("Fehler beim Laden der Werte für", field, err);
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
      
      
      if (document.getElementById("exportButtons")) return;

      const buttonsWrapper = document.createElement("div");
      buttonsWrapper.id = "exportButtons";

      buttonsWrapper.style.marginBottom = "1rem";

      const exportBtn = document.createElement("button");
      exportBtn.textContent = "Excel Export";
      exportBtn.style.marginRight = "10px";
      exportBtn.onclick = () => {
        const table = document.querySelector("#gipfeltabelle");
        let csv = [];
        table.querySelectorAll("tr").forEach(row => {
          let rowData = [];
          row.querySelectorAll("th,td").forEach(cell => {
            rowData.push('"' + cell.textContent.replace(/"/g, '""') + '"');
          });
          csv.push(rowData.join(","));
        });
        const blob = new Blob([csv.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "gipfelbuch_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const printBtn = document.createElement("button");
      printBtn.textContent = "Drucken";
      printBtn.onclick = () => {
        const css = '@page { size: landscape; }';
        const style = document.createElement('style');
        style.type = 'text/css';
        style.media = 'print';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
        window.print();
      };

      buttonsWrapper.appendChild(exportBtn);
      buttonsWrapper.appendChild(printBtn);
      tableWrapper.prepend(buttonsWrapper);


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
  loadFilters();
  fetchData();

  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    filterFields.forEach(field => {
      filters[field].value = "";
    });
    loadFilters();
    fetchData();
  });
});
