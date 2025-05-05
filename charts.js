const API_BASE = "https://alpsteindb.onrender.com/api";
let chart, saisonChart, routeChart, topdayChart;

function buildUrl(params, type = "jahr") {
  const qs = new URLSearchParams(params);
  return API_BASE + "/chart/" + type + "?" + qs.toString();
}

// ... [Gekürzter JS-Code aus vorheriger Nachricht, siehe oben] ...