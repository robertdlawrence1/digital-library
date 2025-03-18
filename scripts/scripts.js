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

function updateThemeIcon() {
  if (document.body.classList.contains('dark-mode')) {
    themeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="white" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="5" fill="white"/>
      <g>
        <line x1="12" y1="1" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
      </g>
    </svg>`;
  } else {
    themeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="black">
      <path d="M21 12.79A9 9 0 0 1 12.21 3a9 9 0 1 0 8.79 9.79z"/>
    </svg>`;
  }
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  updateThemeIcon();
});

bookshelf.style.scrollBehavior = "smooth";

function calculateSpineWidth(pageCount) {
  const minSpineWidth = 60;
  const maxSpineWidth = 160;
  const minPages = 100;
  const maxPages = 1200;

  if (!pageCount || pageCount < minPages) return minSpineWidth;

  const clampedPages = Math.min(pageCount, maxPages);
  const scale = (clampedPages - minPages) / (maxPages - minPages);
  const easedScale = Math.pow(scale, 0.65);

  const width = minSpineWidth + easedScale * (maxSpineWidth - minSpineWidth);
  return Math.round(width);
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

function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";
  const booksToShow = state.activeFilters.length ?
    state.allBooks.filter(book => state.activeFilters.every(tag => book.contentTags.includes(tag))) :
    [...state.allBooks];

  booksToShow.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";
    const spineWidth = calculateSpineWidth(book.pageCount);
    div.style.width = spineWidth + "px";
    div.style.minWidth = spineWidth + "px";
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

document.addEventListener("DOMContentLoaded", () => {
  updateThemeIcon();
  loadBookData();
});
