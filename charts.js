
async function fetchAndRenderBuchChart(filters) {
  const res = await fetch(buildUrl(filters, "buch"));
  const data = await res.json();
  const labels = data.map(d => d.buch);
  const werte = data.map(d => d.count);
  const prozente = data.map(d => d.prozent + "%");
  const colors = labels.map((_, i) =>
    `hsl(${(i * 360) / labels.length}, 60%, 60%)`
  );

  const config = {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Einträge nach Büchern",
        data: werte,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return `${ctx.label}: ${ctx.raw} Einträge (${prozente[ctx.dataIndex]})`;
            }
          }
        }
      }
    }
  };

  if (window.buchChart) window.buchChart.destroy();
  const ctx = document.getElementById("buchChart");
  if (ctx) {
    window.buchChart = new Chart(ctx, config);
  }
}
