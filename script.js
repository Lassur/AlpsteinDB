fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const columns = Object.keys(data[0]).map(key => ({
      title: key.replace(/_/g, ' '),
      data: key
    }));

    $('#gipfelTable').DataTable({
      data: data,
      columns: columns,
      paging: true,
      searching: true,
      responsive: true,
      orderMulti: true,
      dom: 'Bfrtip',
      buttons: ['copyHtml5', 'excelHtml5', 'csvHtml5', 'print'],
      initComplete: function () {
        this.api().columns().every(function () {
          var column = this;
          var input = document.createElement("input");
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
