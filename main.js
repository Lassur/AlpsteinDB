
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Erstbegehung"];
  const filters = {
    VonJahr: document.getElementById("filterVonJahr"),
    BisJahr: document.getElementById("filterBisJahr"),
    Wer: document.getElementById("filterWer")
  };

  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  const tableWrapper = document.getElementById("tabelle-wrapper");
  const loadingSpinner = document.getElementById("loading-spinner");
  let suppressEvents = false;

  function getFilterParams() {
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

  function loadFilters() {
    const all = [...filterFields, "Jahr"];
    all.forEach(field => {
      const select = field === "Jahr" ? null : filters[field];
      const selectedValue = select?.value || "";
      const queryParams = getFilterParams();

      fetch(`${apiUrl}/werte?feld=${encodeURIComponent(field)}&${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (field === "Jahr") {
            ["VonJahr", "BisJahr"].forEach(id => {
              const sel = filters[id];
              const val = sel.value;
              sel.innerHTML = `<option value="">${id === "VonJahr" ? "Von Jahr" : "Bis Jahr"}</option>`;
              data.sort((a, b) => a - b).forEach(y => {
                const opt = new Option(y, y);
                if (y == val) opt.selected = true;
                sel.add(opt);
              });
            });
          } else if (select) {
            select.innerHTML = `<option value="">${field}...</option>`;
            data.forEach(v => {
              const opt = new Option(v, v);
              if (v === selectedValue) opt.selected = true;
              select.add(opt);
            });
          }
        });
    });
  }

  function renderTable(data) {
    const old = document.getElementById("gipfeltabelle");
    if (old) old.remove();

    const table = document.createElement("table");
    table.id = "gipfeltabelle";
    table.innerHTML = `
      <thead><tr>
        <th>Gipfel</th><th>Datum</th><th>Wer</th><th>Route</th><th>Notiz</th>
        <th>Jahr</th><th>Buch</th><th>Erstbegehung</th>
      </tr></thead>
      <tbody>
        ${data.map(e => `
        <tr><td>${e.Gipfel || ""}</td><td>${e.Datum_JMT || ""}</td><td>${e.Wer || ""}</td>
        <td>${e.Route || ""}</td><td>${e.Notiz || ""}</td><td>${e.Jahr || ""}</td>
        <td>${e.Buch || ""}</td><td>${e.Erstbegehung || ""}</td></tr>`).join("")}
      </tbody>`;
    tableWrapper.innerHTML = "";
    tableWrapper.appendChild(table);
    new simpleDatatables.DataTable(table);
  }

  function fetchData() {
    const queryParams = getFilterParams();
    queryParams.append("limit", "10000");
    loadingSpinner.style.display = "block";
    fetch(`${apiUrl}/eintraege?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        renderTable(data);
        loadingSpinner.style.display = "none";
      });
  }

  function clearTable() {
    const t = document.getElementById("gipfeltabelle");
    if (t) t.remove();
  }

  [...filterFields, "VonJahr", "BisJahr"].forEach(f => {
    filters[f].addEventListener("change", () => {
      if (suppressEvents) return;
      loadFilters();
      fetchData();
    });
  });

  filters.Wer.addEventListener("input", () => {
    if (suppressEvents) return;
    clearTimeout(window._werTimer);
    window._werTimer = setTimeout(fetchData, 500);
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    suppressEvents = true;
    Object.values(filters).forEach(el => {
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    });
    clearTable();
    setTimeout(() => {
      suppressEvents = false;
      loadFilters();
    }, 150);
  });

  loadFilters();
});
