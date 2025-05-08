
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const params = new URLSearchParams();
  
  // Vorfilter für "Achter Kreuzberg" setzen
  params.append("gipfel", "Achter Kreuzberg");

  // API-Abfrage mit den Filterparametern
  fetch(`${apiUrl}/eintraege?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
      const tableBody = document.querySelector("#gipfeltabelle tbody");
      tableBody.innerHTML = ''; // Leere den Tabellenkörper, bevor neue Daten eingefügt werden

      data.entries.forEach(entry => {
        const row = document.createElement("tr");

        // Hier fügen wir die Zellen mit den entsprechenden Daten aus der API-Antwort hinzu
        row.innerHTML = `
          <td>${entry.database}</td> <!-- Neue Zelle für Database_ -->
          <td>${entry.gipfel}</td>
          <td>${entry.datum}</td>
          <td>${entry.wer}</td>
          <td>${entry.route}</td>
          <td>${entry.notiz}</td>
          <td>${entry.jahr}</td>
          <td>${entry.buch}</td>
          <td>${entry.erstbegehung}</td>
        `;
        
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('Fehler beim Abrufen der Daten:', error));
});
    