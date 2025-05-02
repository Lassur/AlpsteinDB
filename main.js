
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const fields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};

  fields.forEach(field => {
    const select = document.getElementById("filter" + field);
    filters[field] = select;
    fetch(`${apiUrl}/werte?feld=${field}`)
      .then(res => res.json())
      .then(options => {
        options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          select.appendChild(o);
        });
      });
    select.addEventListener("change", () => {
      fetchData();
    });
  });

  function fetchData() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, select]) => {
      if (select.value) params.append(key.toLowerCase(), select.value);
    });

    fetch(`${apiUrl}/eintraege?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        renderTable(data);
      });
  }

  function renderTable(data) {
    const tableBody = document.querySelector("#gipfeltabelle tbody");
    tableBody.innerHTML = "";
    data.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${e.Gipfel || ""}</td>
        <td>${e.Datum_JMT || ""}</td>
        <td>${e.Wer || ""}</td>
        <td>${e.Route || ""}</td>
        <td>${e.Notiz || ""}</td>
        <td>${e.Jahr || ""}</td>
        <td>${e.Buch || ""}</td>
        <td>${e.Erstbegehung || ""}</td>
      `;
      tableBody.appendChild(row);
    });
    document.getElementById("loading").style.display = "none";
    document.getElementById("gipfeltabelle").style.display = "table";
    if (window.myDataTable) window.myDataTable.destroy();
    window.myDataTable = new simpleDatatables.DataTable("#gipfeltabelle", {
      perPage: 10,
      perPageSelect: [10, 20, 50, 100]
    });
  }

  fetchData();
});
