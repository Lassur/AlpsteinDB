
const API_BASE = "https://alpsteindb.onrender.com/api";

let chart, saisonChart, routeChart;

async function fetchAndRenderChart() {
  const res = await fetch(API_BASE + "/chart/jahr");
  const data = await res.json();

  const jahre = data.map(d => d._id);
  const gruppiert = {};

  data.forEach(d => {
    d.werte.forEach(w => {
      if (!gruppiert[w.status]) gruppiert[w.status] = {};
      gruppiert[w.status][d._id] = w.count;
    });
  });

  const datasets = Object.entries(gruppiert).map(([label, werte]) => ({
    label,
    data: jahre.map(j => werte[j] || 0),
    backgroundColor: label === "Komplett" ? "#4caf50" : "#ff9800"
  }));

  const ctx = document.getElementById("mainChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: jahre,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Einträge pro Jahr nach Status"
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

async function renderRouteChart() {
  // Dummydaten – je nach API-Struktur anpassen
  const data = [
    { jahr: "2020", count: 50 },
    { jahr: "2021", count: 80 },
    { jahr: "2022", count: 60 }
  ];
  const ctx = document.getElementById("routeChart").getContext("2d");

  routeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.jahr),
      datasets: [{
        label: "Routen",
        data: data.map(d => d.count),
        fill: false,
        borderColor: "blue"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Routen pro Jahr"
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

async function renderSaisonChart() {
  const ctx = document.getElementById("saisonChart").getContext("2d");
  saisonChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Frühling", "Sommer", "Herbst", "Winter"],
      datasets: [{
        label: "Saisons",
        data: [120, 300, 150, 80],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Saisonale Verteilung (Beispiel)"
        }
      }
    }
  });
}

async function renderTop10TageChart() {
  try {
    const res = await fetch(API_BASE + "/top10tage");
    if (!res.ok) throw new Error("Fehler beim Laden: " + res.status);
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
    console.error("Top10Tage Fehler:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  fetchAndRenderChart();
  renderRouteChart();
  renderSaisonChart();
  renderTop10TageChart();
});
