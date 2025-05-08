
document.addEventListener("DOMContentLoaded", () => {
  // Table element
  const table = document.querySelector("#gipfeltabelle");

  // Hide the table initially
  table.style.display = "none";

  // Get references to filter elements
  const filterButton = document.querySelector("#filterButton"); // Button zum Suchen
  const suchbegriffInput = document.querySelector("#suchbegriff"); // Beispiel für ein Suchfeld
  const gipfelFilter = document.querySelector("#gipfelFilter"); // Gipfel Filter
  const routeFilter = document.querySelector("#routeFilter"); // Route Filter
  const buchFilter = document.querySelector("#buchFilter"); // Buch Filter
  const jahrFilter = document.querySelector("#jahrFilter"); // Jahr Filter

  // Funktion für Filter-Änderungen
  function updateTableWithFilters() {
    // Überprüfen, ob ein Filter gesetzt wurde
    const filters = {
      suchbegriff: suchbegriffInput.value.trim(),
      gipfel: gipfelFilter.value,
      route: routeFilter.value,
      buch: buchFilter.value,
      jahr: jahrFilter.value
    };

    // API-Abfrage nur bei aktiver Suche durchführen
    fetchData(filters);
  }

  // Fetch-Daten-Funktion
  async function fetchData(filters) {
    try {
      // Tabelle wieder anzeigen, wenn Daten geladen werden
      table.style.display = "table";

      const response = await fetch(`/api/eintraege?suchbegriff=${filters.suchbegriff}&gipfel=${filters.gipfel}&route=${filters.route}&buch=${filters.buch}&jahr=${filters.jahr}`);
      const data = await response.json();

      // Hier wird die Tabelle mit den neuen Daten gefüllt
      updateTable(data);
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);
    }
  }

  // Tabelle mit Daten befüllen
  function updateTable(data) {
    // Alte Daten entfernen
    table.innerHTML = "";

    // Neue Daten hinzufügen
    data.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.Gipfel}</td>
        <td>${entry.Route}</td>
        <td>${entry.Buch}</td>
        <td>${entry.Jahr}</td>
        <td>${entry.Monat}</td>
        <td>${entry.Erstbegehung}</td>
      `;
      table.appendChild(row);
    });
  }

  // Filter-Button (oder eventuelle Eingabefelder) zum Suchen
  filterButton.addEventListener("click", () => {
    updateTableWithFilters();
  });

  // Optionale: Filteränderungen auch automatisch triggern, wenn Filterfelder verändert werden
  gipfelFilter.addEventListener("change", updateTableWithFilters);
  routeFilter.addEventListener("change", updateTableWithFilters);
  buchFilter.addEventListener("change", updateTableWithFilters);
  jahrFilter.addEventListener("change", updateTableWithFilters);
});
