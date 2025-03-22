import { initAuth } from './auth.js';
import { initBookshelf } from './bookshelf.js';
import { initFilters } from './filters.js';
import { initThemeToggle } from './theme-toggle.js';

// Initialize all modules on page load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initThemeToggle();
  initFilters();
  initBookshelf();
});
