
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterIds = ["Gipfel", "Route", "Buch", "Erstbegehung", "VonJahr", "BisJahr", "Wer"];
  const filters = {};

  filterIds.forEach(id => filters[id] = document.getElementById("filter" + id));

  const tableWrapper = document.getElementById("tabelle-wrapper");
  const resetButton = document.getElementById("resetFilters");
  const loadingSpinner = document.getElementById("loading-spinner");

  function getParams() {
    const p = new URLSearchParams();
    if (filters.Gipfel.value) p.append("gipfel", filters.Gipfel.value);
    if (filters.Route.value) p.append("route", filters.Route.value);
    if (filters.Buch.value) p.append("buch", filters.Buch.value);
    if (filters.Erstbegehung.value) p.append("erstbegehung", filters.Erstbegehung.value);
    if (filters.VonJahr.value) p.append("von", filters.VonJahr.value);
    if (filters.BisJahr.value) p.append("bis", filters.BisJahr.value);
    if (filters.Wer.value) p.append("wer", filters.Wer.value);
    return p;
  }

  function loadFilters() {
    const all = ["Gipfel", "Route", "Buch", "Erstbegehung", "Jahr"];
    all.forEach(field => {
      const exclude = field === "Jahr" ? null : field;
      const params = getParams();
      if (exclude) params.delete(field.toLowerCase());

      fetch(\`\${apiUrl}/werte?feld=\${field}&\${params.toString()}\`)
        .then(res => res.json())
        .then(data => {
          if (field === "Jahr") {
            ["VonJahr", "BisJahr"].forEach(id => {
              const sel = filters[id];
              const val = sel.value;
              sel.innerHTML = '<option value="">'+(id === "VonJahr" ? "Von Jahr" : "Bis Jahr")+'</option>';
              data.sort().forEach(y => {
                const o = new Option(y, y);
                if (y == val) o.selected = true;
                sel.add(o);
              });
            });
          } else {
            const sel = filters[field];
            const val = sel.value;
            sel.innerHTML = '<option value="">'+field+'...</option>';
            data.forEach(opt => {
              const o = new Option(opt, opt);
              if (opt === val) o.selected = true;
              sel.add(o);
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
    table.innerHTML = \`
      <thead><tr>
        <th>Gipfel</th><th>Datum</th><th>Wer</th><th>Route</th>
        <th>Notiz</th><th>Jahr</th><th>Buch</th><th>Erstbegehung</th>
      </tr></thead>
      <tbody>\` + data.map(e => \`
        <tr><td>\${e.Gipfel}</td><td>\${e.Datum_JMT}</td><td>\${e.Wer}</td>
        <td>\${e.Route}</td><td>\${e.Notiz}</td><td>\${e.Jahr}</td>
        <td>\${e.Buch}</td><td>\${e.Erstbegehung}</td></tr>\`).join("") + \`
      </tbody>\`;
    tableWrapper.innerHTML = "";
    tableWrapper.appendChild(table);
    new simpleDatatables.DataTable(table);
  }

  function fetchData() {
    const params = getParams();
    params.append("limit", "10000");
    loadingSpinner.style.display = "block";
    fetch(\`\${apiUrl}/eintraege?\${params.toString()}\`)
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

  resetButton.addEventListener("click", () => {
    filterIds.forEach(id => {
      const el = filters[id];
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    });
    clearTable();
    loadFilters();
  });

  // Filteränderung → neue Daten
  ["Gipfel", "Route", "Buch", "Erstbegehung", "VonJahr", "BisJahr"].forEach(id => {
    filters[id].addEventListener("change", () => {
      loadFilters();
      fetchData();
    });
  });

  filters.Wer.addEventListener("input", () => {
    clearTimeout(window._werTimer);
    window._werTimer = setTimeout(() => {
      fetchData();
    }, 500);
  });

  loadFilters();
});
