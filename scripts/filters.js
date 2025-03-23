import { db } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { formatTagForCSS } from './utils.js';

let onFilterChange = null;

export async function initFilters(callback) {
  const filterToggle = document.getElementById('filter-toggle');
  const filterButtons = document.getElementById('filter-buttons');
  onFilterChange = callback;

  const allTags = await fetchUniqueTags();

  allTags.forEach(tag => {
    const formatted = formatTagForCSS(tag);
    const btn = createFilterButton(tag, formatted);
    filterButtons.appendChild(btn);
  });

  filterToggle.addEventListener('click', () => {
    filterButtons.classList.toggle('hidden');
    filterToggle.innerText = filterButtons.classList.contains('hidden')
      ? 'Filter by Topic'
      : 'Hide Filters';
  });
}

function createFilterButton(tag, formattedColorName) {
  const btn = document.createElement('button');
  btn.className = 'filter-button';
  btn.innerText = tag;
  btn.style.backgroundColor = `var(--${formattedColorName})`;

  btn.addEventListener('click', () => handleFilterClick(btn));
  return btn;
}

async function fetchUniqueTags() {
  const querySnapshot = await getDocs(collection(db, "books"));
  const tagSet = new Set();

  querySnapshot.forEach((docSnap) => {
    const tags = docSnap.data().contentTags || [];
    tags.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

function handleFilterClick(btn) {
  const selected = document.querySelectorAll('.');

  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
  } else if (selected.length < 3) {
    btn.classList.add('selected');
  } else {
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 300);
  }

function notifyBookshelf() {
  const selectedTags = [...document.querySelectorAll('.filter-button.selected')]
    .map(btn => formatTagForCSS(btn.innerText));

  const allBooks = document.querySelectorAll('.book');

  allBooks.forEach(book => {
    const bookTags = (book.dataset.tags || '').split(',');
    const isVisible = selectedTags.every(tag => bookTags.includes(tag));

    book.style.display = isVisible || selectedTags.length === 0 ? 'flex' : 'none';
  });

  if (onFilterChange) {
    onFilterChange(selectedTags);
  }
}
