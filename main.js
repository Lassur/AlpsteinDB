
document.addEventListener("DOMContentLoaded", () => {
  fetch("https://alpsteindb.onrender.com/api/eintraege")
    .then(res => res.json())
    .then(data => {
      const tableBody = document.querySelector("#gipfeltabelle tbody");
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
      new simpleDatatables.DataTable("#gipfeltabelle", {
        perPage: 10,
        perPageSelect: [10, 20, 50, 100]
      });
    })
    .catch(err => {
      document.getElementById("loading").textContent = "Fehler beim Laden der Daten.";
      console.error(err);
    });
});
