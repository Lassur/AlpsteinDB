
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
      autoWidth: false,
      dom: 'Blfrtip',
      buttons: [
        {
          extend: 'excelHtml5',
          title: 'Gipfelbuch Alpstein',
          messageTop: '© Andreas Koller, 2025 – andreas-koller@gmx.ch',
          header: true,
          exportOptions: {
            columns: ':visible',
            modifier: {
              search: 'applied',
              page: 'current'
            }
          }
        },
        {
          extend: 'print',
          title: 'Gipfelbuch Alpstein',
          messageTop: '© Andreas Koller, 2025 – andreas-koller@gmx.ch',
          header: true,
          customize: function (win) {
            var css = '@page { size: landscape; }',
                head = win.document.head || win.document.getElementsByTagName('head')[0],
                style = win.document.createElement('style');
            style.type = 'text/css';
            style.media = 'print';
            if (style.styleSheet){
              style.styleSheet.cssText = css;
            } else {
              style.appendChild(win.document.createTextNode(css));
            }
            head.appendChild(style);
          },
          exportOptions: {
            columns: ':visible',
            modifier: {
              search: 'applied',
              page: 'current'
            }
          }
        }
      ],
      initComplete: function () {
        this.api().columns().every(function () {
          var column = this;

          var headerInput = document.createElement("input");
          headerInput.placeholder = "Suche";
          headerInput.style.width = "100%";
          headerInput.style.fontSize = "0.8rem";
          $(headerInput).appendTo($(column.header()).empty())
            .on('keyup change clear', function () {
              if (column.search() !== this.value) {
                column.search(this.value).draw();
              }
            });

          var footerInput = document.createElement("input");
          footerInput.placeholder = column.header().textContent;
          footerInput.style.width = "100%";
          footerInput.style.fontSize = "0.8rem";
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
