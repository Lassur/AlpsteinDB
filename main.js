
fetch('http://localhost:5000/api/eintraege')
  .then(response => response.json())
  .then(data => {
    const root = document.getElementById('root');
    root.innerHTML = '<h1>Gipfelbuch-Einträge</h1>' +
      '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
  });
