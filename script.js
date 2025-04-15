
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const columns = Object.keys(data[0]).map(key => ({ title: key, data: key }));
    $('#gipfelTable').DataTable({
      data: data,
      columns: columns,
      paging: true,
      searching: true,
      responsive: true,
      orderMulti: true
    });
  });
