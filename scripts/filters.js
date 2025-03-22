export function initFilters() {
  const filterToggle = document.getElementById('filter-toggle');
  const filterButtons = document.getElementById('filter-buttons');

  filterToggle.addEventListener('click', () => {
    filterButtons.classList.toggle('hidden');
  });

  // Example: dynamic filter buttons based on tags
  const tags = ['Fiction', 'Non-fiction', 'Sci-fi', 'History'];
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-button';
    btn.innerText = tag;
    filterButtons.appendChild(btn);

    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      // Trigger book filtering logic here
    });
  });
}
