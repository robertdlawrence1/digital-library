let onFilterChange = null;

export function initFilters(callback) {
  const filterToggle = document.getElementById('filter-toggle');
  const filterButtons = document.getElementById('filter-buttons');
  onFilterChange = callback;

  const tags = ['Fiction', 'Non-fiction', 'Sci-fi', 'History', 'Biography', 'Philosophy'];

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

function handleFilterClick(btn) {
  const selected = document.querySelectorAll('.filter-button.selected');

  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
  } else if (selected.length < 3) {
    btn.classList.add('selected');
  } else {
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 300);
  }

  notifyBookshelf();
}

function notifyBookshelf() {
  const selectedTags = [...document.querySelectorAll('.filter-button.selected')].map(btn => btn.innerText);
  if (onFilterChange) {
    onFilterChange(selectedTags);
  }
}
