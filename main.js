
document.addEventListener("DOMContentLoaded", () => {
  fetch('https://alpsteindb.onrender.com/api/eintraege')
    .then(response => response.json())
    .then(data => {
      const tableBody = document.querySelector("#gipfeltabelle tbody");
      data.forEach(eintrag => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${eintrag.Gipfel || ""}</td>
          <td>${eintrag.Datum_JMT || ""}</td>
          <td>${eintrag.Wer || ""}</td>
          <td>${eintrag.Route || ""}</td>
          <td>${eintrag.Notiz || ""}</td>
          <td>${eintrag.Jahr || ""}</td>
          <td>${eintrag.Buch || ""}</td>
          <td>${eintrag.Erstbegehung || ""}</td>
        `;
        tableBody.appendChild(row);
      });
      document.getElementById("loading").style.display = "none";
      document.getElementById("gipfeltabelle").style.display = "table";
      new simpleDatatables.DataTable("#gipfeltabelle");
    })
    .catch(err => {
      document.getElementById("loading").textContent = "Fehler beim Laden der Daten.";
      console.error(err);
    });
});
