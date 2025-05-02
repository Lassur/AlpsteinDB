
document.addEventListener("DOMContentLoaded", () => {
  const filterElements = {
    Gipfel: document.getElementById("filterGipfel"),
    Route: document.getElementById("filterRoute"),
    Buch: document.getElementById("filterBuch"),
    Jahr: document.getElementById("filterJahr"),
    Erstbegehung: document.getElementById("filterErstbegehung"),
  };

  function uniqueOptions(data, key) {
    return [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
  }

  function updateSelectOptions(data) {
    Object.entries(filterElements).forEach(([key, select]) => {
      const options = uniqueOptions(data, key);
      select.innerHTML = '<option value="">'+key+' filtern...</option>' +
        options.map(o => `<option value="${o}">${o}</option>`).join("");
    });
  }

  function applyFilters(data) {
    return data.filter(item => {
      return Object.entries(filterElements).every(([key, select]) => {
        return select.value === "" || item[key] === select.value;
      });
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
    if (window.myDataTable) {
      window.myDataTable.destroy();
    }
    window.myDataTable = new simpleDatatables.DataTable("#gipfeltabelle", {
      perPage: 10,
      perPageSelect: [10, 20, 50, 100]
    });
  }

  let originalData = [];

  function fetchData() {
    fetch("https://alpsteindb.onrender.com/api/eintraege")
      .then(res => res.json())
      .then(data => {
        originalData = data;
        updateSelectOptions(data);
        renderTable(data);
      })
      .catch(err => {
        document.getElementById("loading").textContent = "Fehler beim Laden der Daten.";
        console.error(err);
      });
  }

  Object.values(filterElements).forEach(select => {
    select.addEventListener("change", () => {
      const gefiltert = applyFilters(originalData);
      renderTable(gefiltert);
    });
  });

  fetchData();
});
