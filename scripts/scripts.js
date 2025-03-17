import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC2xKlseyouk18Dr8A-ocoqY77OP56Jtk",
  authDomain: "digital-library-4f53e.firebaseapp.com",
  projectId: "digital-library-4f53e",
  storageBucket: "digital-library-4f53e.appspot.com",
  messagingSenderId: "775289018267",
  appId: "1:775289018267:web:86ea3e5cad787a2a0e733e",
  measurementId: "G-4BVT6LVMHX"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);

const state = { allBooks: [], displayedBooks: [], activeFilters: [], maxFilters: 3, isDarkMode: false };
const tagList = ["auburn", "airforce-blue", "eggplant", "princeton-orange", "pistachio", "slate-blue", "indigo", "forest-green", "rosewood", "teal", "cobalt", "tangerine", "butter", "lavender", "sage", "crimson"];

document.getElementById("theme-toggle").addEventListener("click", () => {
  state.isDarkMode = !state.isDarkMode;
  document.body.classList.toggle("dark-mode", state.isDarkMode);
});

function calculateSpineWidth(pageCount) {
  const minSpineWidth = 50, maxSpineWidth = 120, minPages = 50, maxPages = 1200;
  if (!pageCount || pageCount < minPages) return minSpineWidth;
  const normalized = Math.min(Math.max(pageCount, minPages), maxPages);
  return Math.round(minSpineWidth + Math.pow((normalized - minPages) / (maxPages - minPages), 0.65) * (maxSpineWidth - minSpineWidth));
}

function createFilterButtons() {
  const container = document.getElementById("filter-buttons");
  container.innerHTML = "";
  tagList.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.style.background = `var(--${tag})`;
    btn.textContent = tag;
    btn.addEventListener("click", () => toggleFilter(tag, btn));
    container.appendChild(btn);
  });
}

function toggleFilter(tag, btn) {
  if (state.activeFilters.includes(tag)) {
    state.activeFilters = state.activeFilters.filter(t => t !== tag);
  } else {
    if (state.activeFilters.length >= state.maxFilters) {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 300);
      return;
    }
    state.activeFilters.push(tag);
  }
  renderBooks();
}

function enhancedTextFitting(el, isVertical) {
  if (!el || !el.parentElement) return;
  let fontSize = isVertical ? 15 : 17;
  el.style.fontSize = fontSize + 'px';
  const container = el.parentElement.getBoundingClientRect();
  while ((el.scrollHeight > container.height || el.scrollWidth > container.width) && fontSize > 8) {
    fontSize -= 0.5;
    el.style.fontSize = fontSize + 'px';
  }
}

function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";
  const booksToShow = state.activeFilters.length ?
    state.allBooks.filter(book => state.activeFilters.every(tag => book.contentTags.includes(tag))) :
    [...state.allBooks];

  booksToShow.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";
    const width = calculateSpineWidth(book.pageCount);
    div.style.width = width + "px";
    div.style.minWidth = width + "px";
    const gradient = book.contentTags.slice(0, 3).map(tag => `var(--${tag})`).join(", ");
    div.style.background = `linear-gradient(to bottom, ${gradient})`;

    const titleEl = document.createElement("div");
    titleEl.className = "title-zone";
    titleEl.textContent = book.title;
    const isVertical = width < 55 && book.title.length > 15;
    if (isVertical) titleEl.classList.add("vertical");
    div.appendChild(titleEl);

    const authorEl = document.createElement("div");
    authorEl.className = "author-zone";
    authorEl.textContent = book.author;
    div.appendChild(authorEl);

    const expanded = document.createElement("div");
    expanded.className = "book-expanded-content";
    expanded.innerHTML = `<h3>${book.title}</h3><p><em>by ${book.author}</em></p><p>${book.pageCount} pages | ${book.yearPublished || 'Unknown'}</p><p>${book.summary || ''}</p>`;
    div.appendChild(expanded);

    div.addEventListener("click", (e) => {
      div.classList.toggle("expanded");
      e.stopPropagation();
    });

    // Apply text fitting
    enhancedTextFitting(titleEl, isVertical);
    enhancedTextFitting(authorEl, false);

    shelf.appendChild(div);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".book")) {
      document.querySelectorAll(".book.expanded").forEach(b => b.classList.remove("expanded"));
    }
  });
}

async function loadBookData() {
  const snapshot = await getDocs(collection(db, "books"));
  state.allBooks = snapshot.docs.map(doc => doc.data());
  renderBooks();
  createFilterButtons();
}

loadBookData();
