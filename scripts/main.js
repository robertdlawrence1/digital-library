import { initAuth } from './auth.js';
import { initBookshelf } from './bookshelf.js';
import { initFilters } from './filters.js';
import { initThemeToggle } from './theme-toggle.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initThemeToggle();
  initBookshelf();
  initFilters(applyBookFilter);
});

// Filter logic connected to bookshelf
function applyBookFilter(selectedTags) {
  const books = document.querySelectorAll('.book');

  books.forEach(book => {
    const bookTags = book.dataset.tags ? book.dataset.tags.split(',') : [];
    const matches = selectedTags.length === 0 || selectedTags.some(tag => bookTags.includes(tag.replace(/\s+/g, '-')));

    book.style.display = matches ? '' : 'none';
  });
}
