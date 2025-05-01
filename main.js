fetch('https://alpsteindb.onrender.com/api/eintraege')
  .then(response => response.json())
  .then(data => {
    const root = document.getElementById('root');
    root.innerHTML = '<h1>Gipfelbuch-Einträge</h1>' +
      '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
  })
  .catch(error => {
    document.getElementById('root').innerHTML = '<p>Fehler beim Laden der Daten 😢</p>';
    console.error(error);
  });
