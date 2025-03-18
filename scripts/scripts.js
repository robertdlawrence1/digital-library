// Firebase & Firestore setup
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

const themeToggleBtn = document.getElementById('theme-toggle');
const bookshelf = document.getElementById("bookshelf-container");
const state = { allBooks: [], displayedBooks: [], activeFilters: [], maxFilters: 3 };

const colorSystem = {
  palette: ["auburn", "airforce-blue", "eggplant", "princeton-orange", "pistachio", "slate-blue", "indigo", "forest-green", "rosewood", "teal", "cobalt", "tangerine", "butter", "lavender", "sage", "crimson"],
  tagMap: {}
};

const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 4.5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7.5-4a1 1 0 0 1 1 1h1.5a1 1 0 0 1 0 2H20.5a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1zm-15 0a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1 0-2H4.5a1 1 0 0 1 1-1zm10.6 5.9a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 1 1-1.4 1.4l-1.1-1.1a1 1 0 0 1 0-1.4zM6.4 6.4a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1-1.4 1.4L6.4 7.8a1 1 0 0 1 0-1.4zm10.6 0a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4-1.4l1.1-1.1a1 1 0 0 1 1.4 0zM6.4 17.6a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4-1.4l1.1-1.1a1 1 0 0 1 1.4 0z"/></svg>`;
const moonIcon = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 0 1 12.21 3c-.32 0-.64.02-.95.05a7 7 0 1 0 9.69 9.69c.03-.31.05-.63.05-.95z"/></svg>`;

function updateThemeIcon() {
  if (document.body.classList.contains('dark-mode')) {
    themeToggleBtn.innerHTML = sunIcon;
  } else {
    themeToggleBtn.innerHTML = moonIcon;
  }
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  updateThemeIcon();
});

bookshelf.style.scrollBehavior = "smooth";

// Load books
async function loadBookData() {
  const snapshot = await getDocs(collection(db, "books"));
  const tags = new Set();
  state.allBooks = snapshot.docs.map(doc => {
    const data = doc.data();
    (data.contentTags || []).forEach(tag => tags.add(tag));
    return data;
  });
  [...tags].forEach((tag, index) => {
    colorSystem.tagMap[tag] = colorSystem.palette[index % colorSystem.palette.length];
  });
  createFilterButtons();
  renderBooks();
}

// Filter buttons
function createFilterButtons() {
  const container = document.getElementById("filter-buttons");
  container.innerHTML = "";
  Object.keys(colorSystem.tagMap).forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.style.background = `var(--${colorSystem.tagMap[tag]})`;
    btn.textContent = tag;
    btn.addEventListener("click", () => toggleFilter(tag, btn));
    container.appendChild(btn);
  });
}

function toggleFilter(tag, btn) {
  if (state.activeFilters.includes(tag)) {
    state.activeFilters = state.activeFilters.filter(t => t !== tag);
    btn.classList.remove("selected");
  } else {
    if (state.activeFilters.length >= state.maxFilters) {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 300);
      return;
    }
    state.activeFilters.push(tag);
    btn.classList.add("selected");
  }
  renderBooks();
}

// Render books
function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";
  const booksToShow = state.activeFilters.length ?
    state.allBooks.filter(book => state.activeFilters.every(tag => book.contentTags.includes(tag))) :
    [...state.allBooks];

  booksToShow.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";
    const gradient = book.contentTags.slice(0, 3).map(tag => `var(--${colorSystem.tagMap[tag]})`).join(", ");
    div.style.background = `linear-gradient(to bottom, ${gradient})`;

    const titleEl = document.createElement("div");
    titleEl.className = "title-zone";
    titleEl.textContent = book.title;

    const authorEl = document.createElement("div");
    authorEl.className = "author-zone";
    authorEl.textContent = book.author;

    const expanded = document.createElement("div");
    expanded.className = "book-expanded-content";
    expanded.innerHTML = `<h3>${book.title}</h3><p><em>by ${book.author}</em></p><p>${book.pageCount} pages | ${book.yearPublished || 'Unknown'}</p><p>${book.summary || ''}</p>`;

    div.appendChild(titleEl);
    div.appendChild(authorEl);
    div.appendChild(expanded);

    div.addEventListener("click", (e) => {
      div.classList.toggle("expanded");
      e.stopPropagation();
    });

    div.addEventListener("mouseenter", () => {
      if (window.innerWidth > 768) {
        div.classList.add("expanded");
      }
    });

    div.addEventListener("mouseleave", () => {
      if (window.innerWidth > 768) {
        div.classList.remove("expanded");
      }
    });

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
  const tags = new Set();
  state.allBooks = snapshot.docs.map(doc => {
    const data = doc.data();
    (data.contentTags || []).forEach(tag => tags.add(tag));
    return data;
  });
  [...tags].forEach((tag, index) => {
    colorSystem.tagMap[tag] = colorSystem.palette[index % colorSystem.palette.length];
  });
  createFilterButtons();
  renderBooks();
}

loadBookData();
