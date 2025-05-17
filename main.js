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

  function getFilterParams(excludeField = null) {
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

    return params;
  }

  function loadFilters() {
    [...filterFields, "Jahr"].forEach(field => {
      const select = field === "Jahr" ? null : filters[field];
      const currentValue = select ? select.value : '';
      const params = getFilterParams(field);

      fetch(`${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (field === "Jahr") {
            const sorted = data.sort((a, b) => a - b);
            ["VonJahr", "BisJahr"].forEach(id => {
              const sel = filters[id];
              const val = sel.value;
              sel.innerHTML = `<option value="">${id === "VonJahr" ? "Von Jahr" : "Bis Jahr"}...</option>`;
              sorted.forEach(j => {
                const opt = document.createElement("option");
                opt.value = j;
                opt.textContent = j;
                if (j == val) opt.selected = true;
                sel.appendChild(opt);
              });
            });
          } else if (select) {
            select.innerHTML = '<option value="">' + field + ' filtern...</option>';
            data.forEach(val => {
              const opt = document.createElement("option");
              opt.value = val;
              opt.textContent = val;
              if (val === currentValue) opt.selected = true;
              select.appendChild(opt);
            });
          }
        })
        .catch(err => {
          console.error("Fehler beim Laden der Werte für", field, err);
        });
    });
  }

  function fetchData() {
    showLoadingSpinner();
    const params = getFilterParams();
    params.append("limit", "50000");
    const url = `${apiUrl}/eintraege?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        renderNewTable(data);
        hideLoadingSpinner();
      })
      .catch(err => {
        console.error("Fehler beim Datenladen:", err);
        hideLoadingSpinner();
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
  }

  document.getElementById("loading").style.display = "none";
  tableWrapper.style.display = "block";

  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    location.reload();
  });

  function showLoadingSpinner() {
    loadingSpinner.style.display = "flex";
  }

  function hideLoadingSpinner() {
    loadingSpinner.style.display = "none";
  }
});