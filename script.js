fetch('data.json')
  .then(response => response.json())
  .then(data => {
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
        // Erstelle erweitertes Suchfeld (oben + unten) mit logischem UND
        this.api().columns().every(function () {
          var column = this;
          var headerInput = document.createElement("input");
          headerInput.placeholder = "Suche " + column.header().textContent;
          $(headerInput).appendTo($(column.header()).empty())
            .on('keyup change clear', function () {
              if (column.search() !== this.value) {
                column.search(this.value).draw();
              }
            });

          var footerInput = document.createElement("input");
          footerInput.placeholder = column.header().textContent;
          $(footerInput).appendTo($(column.footer()).empty())
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
