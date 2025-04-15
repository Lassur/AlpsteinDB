
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const tooltips = {
      "Route": `Da für dieselbe Route womöglich verschiedene Namen benutzt werden (z.B. 'Direkte Nordwand' am KI, auch genannt 'Flugroute'), ist diese Spalte angelegt worden. Sie dient der Vereinheitlichung der Routen-Angaben. Auch werden Angaben wie 'Kreuzberg-Traverse VIII-III' oder 'Traverse VII-I' zu 'Traverse W-O' vereinfacht / zusammengefasst.`,
      "Route_unmerged": `Entspricht dem Routen-Namen wie im Gipfelbuch notiert`,
      "Notiz": `Nicht alle Notizen aus den Büchern sind in der Datenbank erfasst. Erfasste Notizen beschränken sich etwa auf genauere Angaben zur Route, genauere Angaben zur Person oder sonst interessante Notizen. Allgemeine Notizen zum Wetter sowie zur persönlichen Gemütslage sind im Normalfall hier nicht erfasst`,
      "Erfasste_Jahre": `"Unvollständig" = Gipfelbuch startet bzw. endet unterjährig, ohne dass ein anderes nahtlos anknüpft. Oder es sind für das entsprechende Jahr lediglich Wand-/Gratbücher vorhanden, aber kein Gipfelbuch. Die Spalte dient statistischen Zwecken.`,
      "Doppelt_eingetragen": `Teilweise haben sich Besteiger gleichzeitig in ein Wandbuch und oben angekommen in das Gipfelbuch eingetragen. Bsp. Direkte Nordwand, gen. "Flugroute", am Ersten Kreuzberg. Um die Daten zu normalisieren - sprich: den entsprechenden Besteiger nur 1mal zu erfassen - ist diese Spalte angelegt worden. Die Spalte dient statistischen Zwecken.`,
      "Erstbegehungen": `Erstbegehungen sind mit "Ja" gekennzeichnet. Ebenfalls sind Unterkategorien von Ersbegehungen, inkl. erste Winterbegehungen, erste Damenbesteigungen, erste Traversen, etc. gekennzeichnet.`
    };
    const columns = Object.keys(data[0]).map(key => {
      const label = key.replace(/_/g, ' ');
      const title = tooltips[key] 
        ? `<span title="{tooltips[key]}">{label}</span>` 
        : label;
      return {
        title: title,
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
