
const API_BASE = "https://alpsteindb.onrender.com/api";

async function renderTop10TageChart(filters) {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(API_BASE + "/top10tage?" + params.toString());
    if (!res.ok) throw new Error("Fehler beim Laden der Daten: " + res.status);
    const data = await res.json();

    const labels = data.map(e => e.tag);
    const counts = data.map(e => e.count);

    const ctx = document.getElementById("top10tageChart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Anzahl Einträge",
          data: counts,
          backgroundColor: "#3e95cd"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Top 10 Tage mit den meisten Einträgen"
          }
        },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { beginAtZero: true }
        }
      }
    });
  } catch (err) {
    console.error("Fehler beim Rendern:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  renderTop10TageChart({});
});
