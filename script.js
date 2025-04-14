
async function loadTable() {
  const res = await fetch('data.json');
  const data = await res.json();

  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');

  if (data.length === 0) return;

  const columns = Object.keys(data[0]);

  // Tabellenkopf
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    tableHead.appendChild(th);
  });

  function renderRows(filteredData) {
    tableBody.innerHTML = '';
    filteredData.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = row[col] || '';
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  // Initiale Anzeige
  renderRows(data);

  // Filter-Funktion
  searchInput.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = data.filter(row =>
      columns.some(col =>
        (row[col] || '').toString().toLowerCase().includes(search)
      )
    );
    renderRows(filtered);
  });
}

loadTable();
