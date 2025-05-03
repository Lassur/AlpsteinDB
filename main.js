
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");

  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
    filters[field].addEventListener("change", () => {
      fetchData();
    });
  });

  function getFilterParams() {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      const val = filters[field].value;
      if (val) params.append(field.toLowerCase(), val);
    });
    return params;
  }

  function fetchData() {
    const params = getFilterParams();
    params.append("limit", "10000");
    const url = `${apiUrl}/eintraege?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => renderTable(data))
      .catch(err => console.error("Datenfehler:", err));
  }

  function renderTable(data) {
    if (window.myDataTable) {
      window.myDataTable.destroy();
    }

    const old = document.getElementById("gipfeltabelle");
    if (old) old.remove();

    const table = document.createElement("table");
    table.id = "gipfeltabelle";
    table.innerHTML = `
      <thead><tr>
        <th>Gipfel</th><th>Datum</th><th>Wer</th><th>Route</th>
        <th>Notiz</th><th>Jahr</th><th>Buch</th><th>Erstbegehung</th>
      </tr></thead>
      <tbody>
        ${data.map(e => `
        <tr>
          <td>${e.Gipfel || ""}</td>
          <td>${e.Datum_JMT || ""}</td>
          <td>${e.Wer || ""}</td>
          <td>${e.Route || ""}</td>
          <td>${e.Notiz || ""}</td>
          <td>${typeof e.Jahr !== "undefined" ? e.Jahr : ""}</td>
          <td>${e.Buch || ""}</td>
          <td>${e.Erstbegehung || ""}</td>
        </tr>`).join("")}
      </tbody>`;
    tableWrapper.appendChild(table);

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
  }

  fetchData();
});
