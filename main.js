document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");

  // Initialize filter dropdowns
  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  // Load filter options
  loadFilters();

  // Event listener for filter changes
  filterFields.forEach(field => {
    filters[field].addEventListener("change", () => {
      // After any change, we need to fetch new options for the remaining filters
      loadFilters(); // Reload filter options based on current selections
      fetchData(); // Fetch and render new data based on selected filters
    });
  });
document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://alpsteindb.onrender.com/api";
  const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
  const filters = {};
  const tableWrapper = document.getElementById("tabelle-wrapper");

  // Initialize filter dropdowns
  filterFields.forEach(field => {
    filters[field] = document.getElementById("filter" + field);
  });

  // Load filter options
  loadFilters();

  // Event listener for filter changes
  filterFields.forEach(field => {
    filters[field].addEventListener("change", () => {
      // After any change, we need to fetch new options for the remaining filters
      loadFilters(); // Reload filter options based on current selections
      fetchData(); // Fetch and render new data based on selected filters
    });
  });

  // Function to get the parameters for the filter API query
  function getFilterParams(excludeField = null) {
    const params = new URLSearchParams();
    filterFields.forEach(field => {
      const val = filters[field].value;
      if (field !== excludeField && val) {
        params.append(field.toLowerCase(), val);
      }
    });
    return params;
  }

  // Fetch filter options and populate the dropdowns
  function loadFilters() {
    filterFields.forEach(field => {
      const select = filters[field];
      const currentValue = select ? select.value : '';
      const params = getFilterParams(field);
      const url = `${apiUrl}/werte?feld=${encodeURIComponent(field)}&${params.toString()}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          select.innerHTML = '<option value="">' + field + ' filtern...</option>';
          data.forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            if (val === currentValue) opt.selected = true;
            select.appendChild(opt);
          });
        })
        .catch(err => {
          console.error("Fehler beim Laden der Werte für", field, err);
        });
    });
  }

  // Fetch data based on selected filters
  async function fetchData() {
