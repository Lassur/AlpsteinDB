const map = L.map('map').setView([47.25, 9.35], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markerLayer = L.layerGroup().addTo(map);

async function ladeMarker() {
  const jahr = document.getElementById("filterJahr").value;
  const buchtyp = document.getElementById("filterBuchtyp").value;
  const res = await fetch(`https://alpsteindb.onrender.com/api/mapdata?jahr=${jahr}&buchtyp=${buchtyp}`);
  const daten = await res.json();

  markerLayer.clearLayers();

  daten.forEach(p => {
    const farbe = p.count > 0 ? "green" : "gray";
    const radius = Math.max(5, Math.sqrt(p.count) * 2);
    const marker = L.circleMarker([p.lat, p.lng], {
      color: farbe,
      radius,
      fillOpacity: 0.8
    }).bindPopup(
      `<strong>${p.name}</strong><br>${p.count} Einträge<br>
       <a href='eintraege.html?gipfel=${encodeURIComponent(p.name)}'>Einträge anzeigen</a>`
    );
    markerLayer.addLayer(marker);
  });
}

document.getElementById("filterJahr").addEventListener("change", ladeMarker);
document.getElementById("filterBuchtyp").addEventListener("change", ladeMarker);
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("filterJahr").value = "";
  document.getElementById("filterBuchtyp").value = "";
  ladeMarker();
});

document.addEventListener("DOMContentLoaded", ladeMarker);