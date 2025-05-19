
document.addEventListener("DOMContentLoaded", async () => {
  const heuteContainer = document.getElementById("today-carousel");
  const notizenContainer = document.getElementById("quote-carousel");

  const wortAnzahl = text => (text.match(/\b\w+\b/g) || []).length;

  function gruppiereEintraege(eintraege) {
    const gruppiert = new Map();
    for (const eintrag of eintraege) {
      const key = `${eintrag.Notiz || ""}__${eintrag.Datum_JMT}`;
      if (!gruppiert.has(key)) {
        gruppiert.set(key, {
          ...eintrag,
          Wer: [eintrag.Wer || "Unbekannt"]
        });
      } else {
        gruppiert.get(key).Wer.push(eintrag.Wer || "Unbekannt");
      }
    }
    return Array.from(gruppiert.values());
  }

  function createEntryCard(eintrag) {
    const div = document.createElement("div");
    div.className = "carousel-item quote";
    const datum = new Date(eintrag.Datum_JMT + "T00:00:00");
    const datumText = datum.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    div.innerHTML = `
      <div style="margin-bottom: 0.5rem; font-size: 1rem;">
        🏔️ <strong>${eintrag.Gipfel || "Unbekannter Gipfel"}</strong><br/>
        🧭 ${eintrag.Route || "Route unbekannt"}<br/>
        📅 ${datumText}
      </div>
      <blockquote style="font-style: italic; font-size: 1.1rem; background: #eef; padding: 1rem; border-left: 4px solid #88c;">
        “${eintrag.Notiz || "Keine Notiz"}”
      </blockquote>
      <div style="margin-top: 0.5rem; font-size: 0.9rem;">
        👤 ${eintrag.Wer.join(", ")}
      </div>
    `;
    return div;
  }

  // --- HEUTE VOR X JAHREN ---
  try {
    const resHeute = await fetch("https://alpsteindb.onrender.com/api/momente/heute");
    const datenHeute = await resHeute.json();
    datenHeute.sort(() => Math.random() - 0.5);

    heuteContainer.innerHTML = "";
    gruppiereEintraege(datenHeute).forEach(eintrag => {
      if (eintrag.Notiz && eintrag.Notiz.trim().length > 0) heuteContainer.appendChild(createEntryCard(eintrag));
    });
  } catch (err) {
    console.error("Fehler beim Laden von /api/momente/heute:", err);
  }

  // --- NOTIZ DES MONATS ---
  try {
    const resMonat = await fetch("https://alpsteindb.onrender.com/api/momente/monat-notizen");
    const datenMonat = await resMonat.json();
    datenMonat.sort(() => Math.random() - 0.5);

    notizenContainer.innerHTML = "";
    gruppiereEintraege(datenMonat).forEach(eintrag => {
      if (wortAnzahl(eintrag.Notiz || "") >= 5) {
        notizenContainer.appendChild(createEntryCard(eintrag));
      }
    });
  } catch (err) {
    console.error("Fehler beim Laden von /api/momente/monat-notizen:", err);
  }

  setInterval(() => nextSlide("today-carousel"), 11000);
  setInterval(() => nextSlide("quote-carousel"), 11000);
  setInterval(() => nextSlide("image-carousel"), 11000);
});
