
// Minimaler Platzhalter oben
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Erstbegehung"];
  const filters = {
    VonJahr: document.getElementById("filterVonJahr"),
    BisJahr: document.getElementById("filterBisJahr"),
    Wer: document.getElementById("filterWer")
  };

  const tableWrapper = document.getElementById("tabelle-wrapper");
  const loadingSpinner = document.getElementById("loading-spinner");

  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  loadFilters();

  Object.entries(filters).forEach(([key, el]) => {
    if (el && el.tagName === "SELECT") {
      el.addEventListener("change", () => {
        fetchData();
        loadFilters();
      });
    }
  });

  filters.Wer.addEventListener("input", () => {
    clearTimeout(window._werTimeout);
    window._werTimeout = setTimeout(() => {
      fetchData();
      loadFilters();
    }, 500);
  });

  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();

    filterFields.forEach(field => {
      if (field !== excludeField) {
        const val = filters[field].value;
        if (val) params.append(field.toLowerCase(), val);
      }
    });

    const von = filters.VonJahr.value;
    const bis = filters.BisJahr.value;
    const wer = filters.Wer.value;

    if (excludeField !== "Jahr") {
      if (von) params.append("von", von);
      if (bis) params.append("bis", bis);
    }
    if (excludeField !== "Wer" && wer) {
      params.append("wer", wer);
    }

    return params;
  }

  
function loadFilters() {
  [...filterFields, "Jahr"].forEach(field => {
    const select = field === "Jahr" ? null : filters[field];
    const currentValue = select ? select.value : '';

    const params = getFilterParams(field === "Jahr" ? null : field);

    if (field === "Jahr") {
      params.delete("von");
      params.delete("bis");
      params.delete("gipfel");
      params.delete("route");
      params.delete("buch");
      params.delete("erstbegehung");
      params.delete("wer");
    } else {
      params.delete("von");
      params.delete("bis");
      if (field !== "Wer") {
        params.delete("wer");
      }
    }

    fetch(`${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (field === "Jahr") {
          const sorted = data.sort((a, b) => a - b);
          ["VonJahr", "BisJahr"].forEach(id => {
            const sel = filters[id];
            const val = sel.value;
            sel.innerHTML = `<option value="">${id === "VonJahr" ? "Von Jahr" : "Bis Jahr"}...</option>`;
            let matched = false;
            sorted.forEach(j => {
              const opt = document.createElement("option");
              opt.value = j;
              opt.textContent = j;
              if (j == val) {
                opt.selected = true;
                matched = true;
              }
              sel.appendChild(opt);
            });
            if (!matched && val) {
              const fallback = document.createElement("option");
              fallback.value = val;
              fallback.textContent = val + " (nicht verfügbar)";
              fallback.selected = true;
              sel.insertBefore(fallback, sel.firstChild);
            }
          });
        } else if (select) {
          select.innerHTML = '<option value="">' + field + ' filtern...</option>';
          let matched = false;
          data.forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            if (val === currentValue) {
              opt.selected = true;
              matched = true;
            }
            select.appendChild(opt);
          });
          if (!matched && currentValue) {
            const fallback = document.createElement("option");
            fallback.value = currentValue;
            fallback.textContent = currentValue + " (nicht verfügbar)";
            fallback.selected = true;
            select.insertBefore(fallback, select.firstChild);
          }
        }
      })
      .catch(err => {
        console.error("Fehler beim Laden der Werte für", field, err);
      });
  });
}

});
