// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC2xKlseyouk18Dr8A-ocoqY77OP56Jtk",
  authDomain: "digital-library-4f53e.firebaseapp.com",
  projectId: "digital-library-4f53e",
  storageBucket: "digital-library-4f53e.firebasestorage.app",
  messagingSenderId: "775289018267",
  appId: "1:775289018267:web:86ea3e5cad787a2a0e733e",
  measurementId: "G-4BVT6LVMHX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const state = {
  allBooks: [],
  displayedBooks: [],
  activeFilters: [],
  maxFilters: 3,
  isDarkMode: false
};

function calculateSpineWidth(pageCount) {
  const minSpineWidth = 50;
  const maxSpineWidth = 120;
  const minPages = 50;
  const maxPages = 1200;
  if (!pageCount || pageCount < minPages) return minSpineWidth;
  let normalizedPages = Math.min(Math.max(pageCount, minPages), maxPages);
  const basePercentage = (normalizedPages - minPages) / (maxPages - minPages);
  const curveStrength = 0.65;
  const adjustedPercentage = Math.pow(basePercentage, curveStrength);
  const spineWidth = minSpineWidth + adjustedPercentage * (maxSpineWidth - minSpineWidth);
  const variation = (Math.random() - 0.5) * (Math.random() * 2);
  return Math.round(spineWidth + variation);
}

function enhancedTextFitting(el, options = {}) {
  if (!el || !el.parentElement) return;
  const defaults = { minFontSize: 8, maxFontSize: 16, lineHeightRatio: 1.2, padding: 5 };
  const settings = { ...defaults, ...options };
  const container = el.parentElement;
  const isVertical = el.classList.contains('vertical');
  const getContainerSize = () => {
    const rect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
    const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(computedStyle.paddingRight, 10) || 0;
    return {
      width: rect.width - paddingLeft - paddingRight - (settings.padding * 2),
      height: rect.height - paddingTop - paddingBottom - (settings.padding * 2)
    };
  };
  const containerSize = getContainerSize();
  const maxWidth = isVertical ? containerSize.width : containerSize.width * 0.9;
  const maxHeight = containerSize.height;
  const textFits = () => {
    if (isVertical) {
      return el.scrollHeight <= maxHeight;
    } else {
      return el.scrollWidth <= maxWidth && el.scrollHeight <= maxHeight;
    }
  };
  let fontSize = settings.maxFontSize;
  el.style.fontSize = fontSize + 'px';
  el.style.lineHeight = (settings.lineHeightRatio) + '';
  while (!textFits() && fontSize > settings.minFontSize) {
    fontSize -= 0.5;
    el.style.fontSize = fontSize + 'px';
  }
}

function createBookElement(book) {
  const bookDiv = document.createElement("div");
  bookDiv.className = "book";
  const spineWidth = calculateSpineWidth(book.pageCount);
  bookDiv.style.width = spineWidth + "px";
  bookDiv.style.minWidth = spineWidth + "px";
  const titleLength = book.title.length;
  let isVerticalTitle = false;
  if (spineWidth < 45) {
    isVerticalTitle = true;
  } else if (spineWidth < 65) {
    isVerticalTitle = titleLength > 15;
  } else {
    isVerticalTitle = titleLength > 25;
  }
  const titleClass = isVerticalTitle ? "title-zone vertical" : "title-zone horizontal";
  bookDiv.innerHTML = `
    <div class="book-spine-text">
      <div class="${titleClass}">
        ${book.title}
      </div>
      <div class="author-zone">
        ${book.author}
      </div>
    </div>
    <div class="book-expanded-content">
      <h3>${book.title}</h3>
      <p><em>by ${book.author}</em></p>
      <p>${book.pageCount} pages | ${book.yearPublished || "Unknown"}</p>
      <p>${book.summary || ""}</p>
      <div class="book-tags">
        ${(Array.isArray(book.contentTags) ? book.contentTags.map(tag => `<span class="book-tag">${tag}</span>`).join('') : '')}
      </div>
    </div>
  `;
  return bookDiv;
}

function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";
  state.displayedBooks.forEach(book => {
    const bookElement = createBookElement(book);
    shelf.appendChild(bookElement);
  });
  const allBooks = document.querySelectorAll('.book');
  allBooks.forEach(bookEl => {
    const titleEl = bookEl.querySelector('.title-zone');
    const authorEl = bookEl.querySelector('.author-zone');
    const isVertical = titleEl.classList.contains('vertical');
    const spineWidthPx = parseInt(bookEl.style.width);
    let minFontSize, maxFontSize;
    if (isVertical) {
      minFontSize = spineWidthPx < 45 ? 7 : 8;
      maxFontSize = spineWidthPx < 45 ? 13 : 15;
    } else {
      minFontSize = spineWidthPx < 55 ? 7 : 8;
      maxFontSize = spineWidthPx < 55 ? 14 : 17;
      if (spineWidthPx >= 60) {
        maxFontSize += 1.5;
      }
      titleEl.style.padding = spineWidthPx < 55 ? '1px' : '2px';
    }
    enhancedTextFitting(titleEl, {
      minFontSize,
      maxFontSize,
      lineHeightRatio: isVertical ? 1.05 : 1.1
    });
    let authorFontMin = spineWidthPx < 55 ? 7 : 8;
    let authorFontMax = spineWidthPx < 55 ? 11 : 12;
    enhancedTextFitting(authorEl, {
      minFontSize: authorFontMin,
      maxFontSize: authorFontMax,
      lineHeightRatio: 1.1
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadBookData();
});

async function loadBookData() {
  const snapshot = await getDocs(collection(db, "books"));
  state.allBooks = snapshot.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, ...data };
  });
  state.displayedBooks = [...state.allBooks];
  renderBooks();
}
