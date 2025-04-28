
fetch('https://www.dropbox.com/scl/fi/pdg56hzh34c9jd87nh2s4/data.json?rlkey=1m5voepc6r8pzfo59h7g11g6o&st=76oqgzvk&dl=1')
  .then(response => response.json())
  .then(data => {
    const columns = Object.keys(data[0]).map(key => {
      const label = key.replace(/_/g, ' ');
      return {
        title: label,
        data: key
      };
    });

    const table = $('#gipfelTable').DataTable({
      data: data,
      columns: columns,
      paging: true,
      lengthMenu: [10, 25, 50, 100],
      searching: true,
      responsive: true,
      orderMulti: true,
      autoWidth: false,
      language: {
        lengthMenu: "Zeige _MENU_ Einträge",
        zeroRecords: "Keine passenden Einträge gefunden",
        info: "Zeige _START_ bis _END_ von _TOTAL_ Einträgen",
        infoEmpty: "Keine verfügbaren Einträge",
        infoFiltered: "(gefiltert von _MAX_ Einträgen)",
        search: "Suche:",
        paginate: {
          first: "Erste",
          last: "Letzte",
          next: "Nächste",
          previous: "Zurück"
        }
      },
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
            if (style.styleSheet) {
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
        const api = this.api();
        const thead = document.querySelector("#gipfelTable thead");
        const filterRow = document.createElement("tr");

        api.columns().every(function () {
          const column = this;
          const th = document.createElement("th");
          const input = document.createElement("input");
          input.placeholder = "Suche";
          input.style.width = "100%";
          input.style.fontSize = "0.8rem";
          input.addEventListener('keyup', function () {
            if (column.search() !== this.value) {
              column.search(this.value).draw();
            }
          });
          th.appendChild(input);
          filterRow.appendChild(th);
        });
        thead.appendChild(filterRow);
      }
    });

    const thead = document.querySelector("#gipfelTable thead");
    if (!thead.innerHTML.trim()) {
      thead.innerHTML = "<tr>" + columns.map(col => `<th>${col.title}</th>`).join("") + "</tr>";
    }

    const footer = document.querySelector("#gipfelTable tfoot");
    if (!footer.innerHTML.trim()) {
      footer.innerHTML = "<tr>" + columns.map(() => "<th></th>").join("") + "</tr>";
    }
  });


function resetFilters() {
  const inputs = document.querySelectorAll('select, input[type="text"]');
  inputs.forEach(input => input.value = "");
  if (typeof updateAllCharts === "function") updateAllCharts();
  if (typeof DataTable !== "undefined") {
    $('#gipfelTable').DataTable().search("").columns().search("").draw();
    $('#booksTable').DataTable().search("").columns().search("").draw();
  }
}
