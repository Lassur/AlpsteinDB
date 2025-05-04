
document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#eintragTabelle tbody");
  const suchFelder = {
    Gipfel: document.getElementById("filterGipfel"),
    Route: document.getElementById("filterRoute"),
    Buch: document.getElementById("filterBuch"),
    Buchtyp: document.getElementById("filterBuchtyp"),
    Erfasste_Jahre: document.getElementById("filterErfasst"),
    Jahr: document.getElementById("filterJahr"),
    Monat: document.getElementById("filterMonat")
  };

  let daten = [];

  async function ladeDaten() {
    const res = await fetch("https://alpsteindb.onrender.com/api/eintraege");
    daten = await res.json();
    initialisiereFilter();
    zeigeTabelle();
  }

  function initialisiereFilter() {
    Object.entries(suchFelder).forEach(([feld, select]) => {
      const werte = [...new Set(daten.map(e => e[feld]).filter(v => v))].sort();
      select.innerHTML = "<option value=''>–</option>";
      werte.forEach(wert => {
        const opt = document.createElement("option");
        opt.value = wert;
        opt.textContent = wert;
        select.appendChild(opt);
      });
    });
  }

  function zeigeTabelle() {
    const gefiltert = daten.filter(eintrag => {
      return Object.entries(suchFelder).every(([feld, select]) => {
        return !select.value || eintrag[feld] === select.value;
      });
    });

    tableBody.innerHTML = "";
    gefiltert.forEach(e => {
      const tr = document.createElement("tr");
      Object.keys(suchFelder).forEach(feld => {
        const td = document.createElement("td");
        td.textContent = e[feld] ?? "";
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    document.getElementById("anzahl").textContent = `Gefundene Einträge: ${gefiltert.length}`;
  }

  document.querySelectorAll(".filter select").forEach(sel => {
    sel.addEventListener("change", zeigeTabelle);
  });

  document.getElementById("resetFilter").addEventListener("click", () => {
    document.querySelectorAll(".filter select").forEach(sel => sel.value = "");
    zeigeTabelle();
  });

  ladeDaten();
});
