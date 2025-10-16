// scripts/search.js
export function setupSearch(data, renderList) {
  const searchInput = document.getElementById('searchInput');
  const caseToggle = document.getElementById('caseToggle');
  const searchError = document.getElementById('searchError');

  function doSearch() {
    const val = searchInput.value.trim();
    const flags = caseToggle.checked ? 'i' : '';
    let re = null;

    try {
      re = val ? new RegExp(val, flags) : null;
      searchError.textContent = '';
    } catch {
      searchError.textContent = '⚠️ Invalid regex pattern!';
    }

    if (!re) {
      renderList(data);
      return;
    }

    const filtered = data.filter(t =>
      re.test(`${t.title} ${t.type} ${t.tags.join(' ')}`)
    );
    renderList(filtered);
  }

  searchInput.addEventListener('input', doSearch);
  caseToggle.addEventListener('change', doSearch);
}
