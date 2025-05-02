
document.addEventListener("DOMContentLoaded", () => {
  const globalSearchInput = document.getElementById("globalSearch");

  function fetchAndDisplay(suchbegriff = "") {
    const url = "https://alpsteindb.onrender.com/api/eintraege" + (suchbegriff ? `?suchbegriff=${encodeURIComponent(suchbegriff)}` : "");
    fetch(url)
      .then(res => res.json())
      .then(data => {
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
      })
      .catch(err => {
        document.getElementById("loading").textContent = "Fehler beim Laden der Daten.";
        console.error(err);
      });
  }

  globalSearchInput.addEventListener("input", () => {
    const suchbegriff = globalSearchInput.value.trim();
    fetchAndDisplay(suchbegriff);
  });

  fetchAndDisplay();
});
