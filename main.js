
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Erstbegehung"];
  const filters = {
    VonJahr: document.getElementById("filterVonJahr"),
    BisJahr: document.getElementById("filterBisJahr"),
    Wer: document.getElementById("filterWer"),
    Notiz: document.getElementById("filterNotiz")
  };

  const tableWrapper = document.getElementById("tabelle-wrapper");
  const loadingSpinner = document.getElementById("loading-spinner");
  const loadingText = document.getElementById("loading");

  filterFields.forEach(field => {
    const el = document.getElementById("filter" + field);
    if (!el) {
      console.warn("Filterelement fehlt:", field);
    }
    filters[field] = el;
  });

  // Sicht initial verbergen
  hideLoadingSpinner();
  loadingText.style.display = "none";
  tableWrapper.style.display = "none";

  // Dropdowns laden
  loadFilters();

  // Filteränderung => Daten laden
  Object.entries(filters).forEach(([key, el]) => {
    if (el && el.tagName === "SELECT") {
      el.addEventListener("change", () => {
        fetchDataIfFiltersSet();
        loadFilters();
      });
    }
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
    clearTimeout(window._werTimeout);
    window._werTimeout = setTimeout(() => {
      fetchDataIfFiltersSet();
      loadFilters();
    }, 500);
  });

  function isAnyFilterSet() {
    // return Object.values(filters).some(el => el?.value);
  }

  function fetchDataIfFiltersSet() {
    if (isAnyFilterSet()) {
      fetchData();
    } else {
      clearTable();
    }
  }

  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      const el = filters[field];
      if (field !== excludeField && el) {
        const val = el.value;
        if (val) params.append(field.toLowerCase(), val);
    return params;
      }
    });

    const von = filters.VonJahr?.value;
    const bis = filters.BisJahr?.value;
    const wer = filters.Wer?.value;

    if (excludeField !== "Jahr") {
      if (von) params.append("von", von);
      if (bis) params.append("bis", bis);
    }
    if (excludeField !== "Wer" && wer) {
      params.append("wer", wer);
    }
    const notiz = filters.Notiz?.value;
    if (excludeField !== "Notiz" && notiz) {
      params.append("notiz", notiz);
    }
      params.append("wer", wer);
    }

  }

  function loadFilters() {
    [...filterFields, "Jahr"].forEach(field => {
      const select = field === "Jahr" ? null : filters[field];
      const currentValue = select ? select.value : '';

      const params = getFilterParams(field === "Jahr" ? null : field);

      if (field === "Jahr") {
      params.delete("von");
      params.delete("bis");
      params.delete("wer");
      } else {
        params.delete("von");
        params.delete("bis");
        if (field !== "Wer") {
          params.delete("wer");
        }
      }

      fetch(`${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (field === "Jahr") {
            const sorted = data.sort((a, b) => a - b);
            ["VonJahr", "BisJahr"].forEach(id => {
              const sel = filters[id];
              const val = sel?.value;
              if (!sel) 
              sel.innerHTML = `<option value="">${id === "VonJahr" ? "Von Jahr" : "Bis Jahr"}...</option>`;
              let matched = false;
              sorted.forEach(j => {
                const opt = document.createElement("option");
                opt.value = j;
                opt.textContent = j;
                if (j == val) {
                  opt.selected = true;
                  matched = true;
                }
                sel.appendChild(opt);
              });
              if (!matched && val) {
                const fallback = document.createElement("option");
                fallback.value = val;
                fallback.textContent = val + " (nicht verfügbar)";
                fallback.selected = true;
                sel.insertBefore(fallback, sel.firstChild);
              }
            });
          } else if (select) {
            select.innerHTML = '<option value="">' + field + ' filtern...</option>';
            let matched = false;
            data.forEach(val => {
              const opt = document.createElement("option");
              opt.value = val;
              opt.textContent = val;
              if (val === currentValue) {
                opt.selected = true;
                matched = true;
              }
              select.appendChild(opt);
            });
            if (!matched && currentValue) {
              const fallback = document.createElement("option");
              fallback.value = currentValue;
              fallback.textContent = currentValue + " (nicht verfügbar)";
              fallback.selected = true;
              select.insertBefore(fallback, select.firstChild);
            }
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

    if (!data.length) {
      tableWrapper.style.display = "none";
      
    }

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
		  <th>Route unmerged</th>
          <th>Notiz</th>
          <th>Buch</th>
          <th>Erstbegehung</th>
		  <th>Kommentar A.Koller</th>
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
			<td>${e.Route_unmerged || ""}</td>
            <td>${e.Notiz || ""}</td>
            <td>${e.Buch || ""}</td>
            <td>${e.Erstbegehung || ""}</td>
			<td>${e.Kommentar_A_Koller || ""}</td>
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

    loadingText.style.display = "none";
    tableWrapper.style.display = "block";
  }

  function clearTable() {
    if (window.myDataTable) {
      window.myDataTable.destroy();
      window.myDataTable = null;
    }
    const oldTable = document.getElementById("gipfeltabelle");
    if (oldTable) oldTable.remove();
    tableWrapper.style.display = "none";
  }

  const resetButton = document.getElementById("resetFilters");
  resetButton.addEventListener("click", () => {
    Object.values(filters).forEach(el => {
      if (el?.tagName === "SELECT") el.selectedIndex = 0;
      if (el?.type === "text") el.value = "";
    });
    clearTable();
    loadFilters();
  });

  function showLoadingSpinner() {
    loadingSpinner.style.display = "flex";
  }

  function hideLoadingSpinner() {
    loadingSpinner.style.display = "none";
  }
});





function getActiveFiltersText() {
  const filterMap = {
    "Gipfel": document.getElementById("filterGipfel"),
    "Route": document.getElementById("filterRoute"),
    "Buch": document.getElementById("filterBuch"),
    "Erstbegehung": document.getElementById("filterErstbegehung"),
    "Von Jahr": document.getElementById("filterVonJahr"),
    "Bis Jahr": document.getElementById("filterBisJahr"),
    "Wer": document.getElementById("filterWer"),
    "Notiz": document.getElementById("filterNotiz")
  };

  const active = [];
  for (const [label, el] of Object.entries(filterMap)) {
    if (el && el.value) {
      active.push(`${label} = ${el.value}`);
    }
  }
  // return active.length ? active.join(", ") : "Keine Filter aktiv";
}


window.addEventListener("beforeprint", () => {
  const printHeader = document.getElementById("printHeader");
  const now = new Date();
  document.getElementById("druckZeit").textContent = now.toLocaleString('de-DE');
  document.getElementById("druckFilter").textContent = getActiveFiltersText();
  printHeader.style.display = "block";
});


window.addEventListener("afterprint", () => {
  document.getElementById("printHeader").style.display = "none";
});


function exportToExcel() {
  const table = document.getElementById("gipfeltabelle");
  if (!table) {
    alert("Keine Tabelle zum Exportieren gefunden.");
    
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "Einträge");

  const now = new Date();
  const timestamp = now.toLocaleString('de-DE');
  const filters = getActiveFiltersText();

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ["Projekt", "Andreas Koller – Projekt 'AlpsteinDB'"],
    ["Link", "https://lassur.github.io/AlpsteinDB/"],
    ["Exportzeitpunkt", timestamp],
    ["Verwendete Filter", filters]
  ]);
  XLSX.utils.book_append_sheet(wb, infoSheet, "Info");

  XLSX.writeFile(wb, `Gipfelbuch_Export_${now.toISOString().slice(0,10)}.xlsx`);
}
