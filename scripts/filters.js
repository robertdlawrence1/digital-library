export function initFilters() {
  const filterToggle = document.getElementById('filter-toggle');
  const filterButtons = document.getElementById('filter-buttons');

  const tags = ['Fiction', 'Non-fiction', 'Sci-fi', 'History', 'Biography', 'Philosophy'];

  // Generate filter buttons dynamically
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-button';
    btn.innerText = tag;
    filterButtons.appendChild(btn);

    btn.addEventListener('click', () => handleFilterClick(btn));
  });

  filterToggle.addEventListener('click', () => {
    filterButtons.classList.toggle('hidden');
  });
}

// Max tag selection logic (limit = 3)
function handleFilterClick(btn) {
  const selected = document.querySelectorAll('.filter-button.selected');

  if (btn.classList.contains('selected')) {
    // Deselect button
    btn.classList.remove('selected');
  } else if (selected.length < 3) {
    // Select button if under the limit
    btn.classList.add('selected');
  } else {
    // Shake animation if over limit
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 300);
  }

  logSelectedTags();
}

function logSelectedTags() {
  const selectedTags = [...document.querySelectorAll('.filter-button.selected')].map(btn => btn.innerText);
  console.log('Active filters:', selectedTags);
}
