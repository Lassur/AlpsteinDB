fetch('data.json')
  .then(response => response.json())
  .then(data => {
    // Format Datum für Anzeige
    data.forEach(row => {
      if (row.Datum_TMJ) {
        const parts = row.Datum_TMJ.split("-");
        row.Datum_TMJ = parts[2] + '.' + parts[1] + '.' + parts[0];
      }
    });

    const columns = Object.keys(data[0]).map(key => ({
      title: key.replace(/_/g, ' '),
      data: key
    }));

    const table = $('#gipfelTable').DataTable({
      data: data,
      columns: columns,
      paging: true,
      lengthMenu: [10, 25, 50, 100],
      searching: true,
      responsive: true,
      orderMulti: true,
      dom: 'Blfrtip',
      buttons: ['excelHtml5', 'print'],
      initComplete: function () {
        this.api().columns().every(function () {
          var column = this;
          var input = document.createElement("input");
          input.placeholder = column.header().textContent;
          $(input).appendTo($(column.footer()).empty())
                 .on('keyup change clear', function () {
                   if (column.search() !== this.value) {
                     column.search(this.value).draw();
                   }
                 });
        });
      }
    });

    const footer = document.querySelector("#gipfelTable tfoot");
    if (!footer.innerHTML.trim()) {
      footer.innerHTML = "<tr>" + columns.map(() => "<th></th>").join("") + "</tr>";
    }
  });
