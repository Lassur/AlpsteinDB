
document.addEventListener("DOMContentLoaded", async () => {
  const heuteContainer = document.getElementById("today-carousel");
  const notizenContainer = document.getElementById("quote-carousel");

  // Hilfsfunktion zur Wortanzahl
  const wortAnzahl = text => (text.match(/\b\w+\b/g) || []).length;

  // --- HEUTE VOR X JAHREN ---
  try {
    const resHeute = await fetch("/api/momente/heute");
    const datenHeute = await resHeute.json();

    heuteContainer.innerHTML = "";
    datenHeute.forEach(eintrag => {
      const div = document.createElement("div");
      div.className = "carousel-item quote";
      div.textContent = `(${eintrag.Datum_JMT}) – ${eintrag.Notiz || "Keine Notiz"}`;
      heuteContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Fehler beim Laden von /api/momente/heute:", err);
  }

  // --- NOTIZ DES MONATS ---
  try {
    const resMonat = await fetch("/api/momente/monat-notizen");
    const datenMonat = await resMonat.json();

    notizenContainer.innerHTML = "";
    datenMonat.forEach(eintrag => {
      const text = eintrag.Notiz || "";
      if (wortAnzahl(text) >= 5) {
        const div = document.createElement("div");
        div.className = "carousel-item quote";
        div.textContent = `(${eintrag.Datum_JMT}) – ${text}`;
        notizenContainer.appendChild(div);
      }
    });
  } catch (err) {
    console.error("Fehler beim Laden von /api/momente/monat-notizen:", err);
  }
});
