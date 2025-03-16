/****************************************************
 * Firebase Setup
 ****************************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAC2xKlseyouk18Dr8A-ocoqY77OP56Jtk",
  authDomain: "digital-library-4f53e.firebaseapp.com",
  projectId: "digital-library-4f53e",
  storageBucket: "digital-library-4f53e.firebasestorage.app",
  messagingSenderId: "775289018267",
  appId: "1:775289018267:web:86ea3e5cad787a2a0e733e",
  measurementId: "G-4BVT6LVMHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

/****************************************************
 * Application State
 ****************************************************/
const state = {
  allBooks: [],
  displayedBooks: [],
  activeFilters: [],
  maxFilters: 3,
  isDarkMode: false
};

/****************************************************
 * Color Theme System (for filters, etc.)
 ****************************************************/
const colorSystem = {
  // Map for tag colors - will be populated dynamically
  tagColors: {},
  
  // Colorful palette for tag assignments
  colorPalette: [
    "#3d5a80", "#7d4e57", "#41729f", "#5e3023", "#354f52", "#5e548e",
    "#028090", "#d62828", "#4a4e69", "#687864", "#5f0f40", "#9e2a2b",
    "#323031", "#540b0e", "#e09f3e", "#335c67"
  ],

  // Default colors for books with no matching tags
  defaultColors: ["#8B4513", "#A0522D", "#6B4226", "#855E42"],
  
  // Initialize tag colors from available tags
  initializeTagColors(tags) {
    this.tagColors = {};
    tags.forEach((tag, index) => {
      this.tagColors[tag] = this.colorPalette[index % this.colorPalette.length];
    });
  },
  
  // Get the color for a specific tag (for filter buttons)
  getTagColor(tag) {
    return this.tagColors[tag] || "#8B4513";
  }
};

/****************************************************
 * Theme Management
 ****************************************************/
function toggleDarkMode() {
  state.isDarkMode = !state.isDarkMode;
  document.body.classList.toggle('dark-mode', state.isDarkMode);
  
  // Update filter button styling (if needed)
  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach(btn => {
    // Additional styling adjustments can be placed here.
  });
  
  // Re-render books for dark mode appearance updates
  renderBooks();
}

/****************************************************
 * Spine Width Calculation
 ****************************************************/

function calculateSpineWidth(pageCount) {
  // Increase minimum spine width
  const minSpineWidth = 35;  // Was 28
  const maxSpineWidth = 90;  // Was 85
  const minPages = 50;
  const maxPages = 1200;

  if (!pageCount || pageCount < minPages) return minSpineWidth;

  let normalizedPages = Math.min(Math.max(pageCount, minPages), maxPages);
  const basePercentage = (normalizedPages - minPages) / (maxPages - minPages);
  const curveStrength = 0.65;
  const adjustedPercentage = Math.pow(basePercentage, curveStrength);
  
  const spineWidth = minSpineWidth + adjustedPercentage * (maxSpineWidth - minSpineWidth);
  const variation = (Math.random() - 0.5) * (Math.random() * 2); // Reduced variation
  
  return Math.round(spineWidth + variation);
}

/****************************************************
 * Helper: Averaging Hues for Tag-Based Colors
 ****************************************************/
function tagToHue(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function averageHue(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return 0;
  }
  const hues = tags.map(tagToHue);
  const sum = hues.reduce((acc, hue) => acc + hue, 0);
  return Math.round(sum / hues.length);
}

/****************************************************
 * Text Fitting for Book Spines
 ****************************************************/

function improvedTextFitting(el, minFontSize = 8, maxFontSize = 16) {
  if (!el) return;
  const container = el.parentElement;
  if (!container) return;
  
  // Store original text and reset any previous modifications
  const originalText = el.textContent;
  el.style.fontSize = '';
  el.textContent = originalText;  // Restore original text in case it was truncated before
  
  const isVertical = el.classList.contains('vertical');
  
  // Start with a reasonable font size based on text length
  // Longer text starts with smaller font size to avoid excessive resizing iterations
  let fontSize = Math.max(
    minFontSize, 
    maxFontSize - (originalText.length > 20 ? 2 : 0)
  );
  
  el.style.fontSize = fontSize + 'px';
  
  // For vertical text (on narrow spines)
  if (isVertical) {
    // Try smaller font sizes until text fits height
    while (el.scrollHeight > container.clientHeight * 0.9 && fontSize > minFontSize) {
      fontSize -= 0.5;
      el.style.fontSize = fontSize + 'px';
    }
    
    // Don't truncate text unless absolutely necessary
    if (fontSize === minFontSize && el.scrollHeight > container.clientHeight * 0.95) {
      // Only in extreme cases where even minimum font size doesn't fit
      const estimatedCharsPerHeight = Math.floor((container.clientHeight * 0.95) / (fontSize * 1));
      if (estimatedCharsPerHeight < originalText.length && estimatedCharsPerHeight > 10) {
        el.textContent = originalText.substring(0, estimatedCharsPerHeight - 3) + '...';
      }
    }
  } else {
    // For horizontal text
    while (el.scrollWidth > container.clientWidth * 0.95 && fontSize > minFontSize) {
      fontSize -= 0.5;
      el.style.fontSize = fontSize + 'px';
    }
    
    // Only truncate as absolute last resort
    if (fontSize === minFontSize && el.scrollWidth > container.clientWidth * 0.95) {
      const estimatedCharsPerWidth = Math.floor((container.clientWidth * 0.95) / (fontSize * 0.5));
      if (estimatedCharsPerWidth < originalText.length && estimatedCharsPerWidth > 8) {
        el.textContent = originalText.substring(0, estimatedCharsPerWidth - 3) + '...';
      }
    }
  }
}

/****************************************************
 * Create Book Element
 ****************************************************/

function createBookElement(book) {
  const bookDiv = document.createElement("div");
  bookDiv.className = "book";

  const spineWidth = calculateSpineWidth(book.pageCount);
  bookDiv.style.width = spineWidth + "px";
  bookDiv.style.minWidth = spineWidth + "px";

  // Color logic (unchanged)
  let bgColor;
  if (Array.isArray(book.contentTags) && book.contentTags.length > 0) {
    const avgHue = averageHue(book.contentTags);
    bgColor = `hsl(${avgHue}, 60%, 50%)`;
  } else {
    bgColor = colorSystem.defaultColors[Math.floor(Math.random() * colorSystem.defaultColors.length)];
  }
  bookDiv.style.background = bgColor;
  bookDiv.style.color = "#fff";

  // Better decision logic for vertical/horizontal text
  // Use spine width and title length to decide orientation
  const titleLength = book.title.length;
  let isVerticalTitle = false;
  
  // Decision tree for vertical text
  if (spineWidth < 40) {
    // Very narrow books almost always need vertical text
    isVerticalTitle = true;
  } else if (spineWidth < 60) {
    // Medium width books use vertical for longer titles
    isVerticalTitle = titleLength > 12;
  } else {
    // Wider books can fit more horizontal text
    isVerticalTitle = titleLength > 20;
  }
  
  const titleClass = isVerticalTitle ? "title-zone vertical" : "title-zone horizontal";

  // Build the spine's HTML (unchanged)
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
        ${Array.isArray(book.contentTags) ? book.contentTags.map(tag => 
          `<span class="book-tag" style="background-color: ${colorSystem.getTagColor(tag)}">${tag}</span>`
        ).join('') : ''}
      </div>
    </div>
  `;

  // Click event handler (unchanged)
  bookDiv.addEventListener("click", (e) => {
    bookDiv.classList.toggle("expanded");
    if (bookDiv.classList.contains("expanded")) {
      document.querySelectorAll(".book.expanded").forEach(expandedBook => {
        if (expandedBook !== bookDiv) {
          expandedBook.classList.remove("expanded");
        }
      });
    }
    e.stopPropagation();
  });

  return bookDiv;
}

/****************************************************
 * Render Books - Enhanced Version
 ****************************************************/
function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";

  if (!state.displayedBooks.length) {
    const message = document.createElement("div");
    message.className = "message";
    message.textContent = "No books found matching these filters.";
    shelf.appendChild(message);
    return;
  }

  state.displayedBooks.forEach(book => {
    const bookElement = createBookElement(book);
    shelf.appendChild(bookElement);
  });

  // Apply improved text fitting to all books
  const allBooks = document.querySelectorAll('.book');
  allBooks.forEach(bookEl => {
    const titleEl = bookEl.querySelector('.title-zone');
    const authorEl = bookEl.querySelector('.author-zone');
    
    // Use our new improvedTextFitting function with appropriate parameters
    improvedTextFitting(titleEl, 9, 16);
    improvedTextFitting(authorEl, 8, 14); // Smaller font size range for authors
  });

  // Collapse expanded books when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".book")) {
      document.querySelectorAll(".book.expanded").forEach(b => b.classList.remove("expanded"));
    }
  });
}

/****************************************************
 * Filter Logic
 ****************************************************/
function createFilterButtons() {
  const container = document.getElementById("filter-buttons");
  container.innerHTML = "";

  // Extract all unique tags from books
  const allTags = new Set();
  state.allBooks.forEach(book => {
    if (Array.isArray(book.contentTags)) {
      book.contentTags.forEach(tag => allTags.add(tag));
    }
  });

  const sortedTags = Array.from(allTags).sort();
  
  // Initialize color system for filter buttons
  colorSystem.initializeTagColors(sortedTags);

  // Create filter buttons
  sortedTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = tag;
    
    const tagColor = colorSystem.getTagColor(tag);
    btn.style.borderColor = tagColor;
    btn.style.borderLeft = `6px solid ${tagColor}`;
    
    // Set appearance based on theme
    if (state.isDarkMode) {
      btn.style.backgroundColor = "#333";
      btn.style.color = "#ddd";
    } else {
      btn.style.backgroundColor = "#eee";
      btn.style.color = "#333";
    }
    
    btn.addEventListener("click", () => toggleFilter(tag, btn));
    container.appendChild(btn);
  });
}

function toggleFilter(tag, buttonElement) {
  if (state.activeFilters.includes(tag)) {
    state.activeFilters = state.activeFilters.filter(t => t !== tag);
    buttonElement.classList.remove("selected");
    buttonElement.style.backgroundColor = state.isDarkMode ? "#333" : "#eee";
    buttonElement.style.color = state.isDarkMode ? "#ddd" : "#333";
    buttonElement.style.borderColor = colorSystem.getTagColor(tag);
    buttonElement.style.borderLeft = `6px solid ${colorSystem.getTagColor(tag)}`;
  } else {
    if (state.activeFilters.length >= state.maxFilters) return;
    state.activeFilters.push(tag);
    buttonElement.classList.add("selected");
    const tagColor = colorSystem.getTagColor(tag);
    buttonElement.style.backgroundColor = tagColor;
    buttonElement.style.color = "#fff";
    buttonElement.style.borderColor = tagColor;
  }
  applyFilters();
}

function applyFilters() {
  if (!state.activeFilters.length) {
    state.displayedBooks = [...state.allBooks];
  } else {
    state.displayedBooks = state.allBooks.filter(book =>
      state.activeFilters.every(tag =>
        Array.isArray(book.contentTags) && book.contentTags.includes(tag)
      )
    );
  }
  renderBooks();
}

/****************************************************
 * Load Data from Firestore
 ****************************************************/
async function loadBookData() {
  try {
    document.getElementById("bookshelf").innerHTML =
      "<div class='message'>Loading your book collection...</div>";

    const snapshot = await getDocs(collection(db, "books"));
    state.allBooks = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data };
    });

    console.log("Loaded books:", state.allBooks.map(b => ({
      title: b.title,
      pageCount: b.pageCount
    })));

    state.displayedBooks = [...state.allBooks];
    createFilterButtons();
    renderBooks();

  } catch (error) {
    console.error("Error loading book data:", error);
    document.getElementById("bookshelf").innerHTML =
      "<div class='message'>Error loading books. Please check your connection and try again.</div>";
  }
}

/****************************************************
 * Start the Application
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  themeToggleBtn.addEventListener('click', toggleDarkMode);
  
  // Apply initial theme based on system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    toggleDarkMode();
  }
  
  // Load book data from Firestore
  loadBookData();
});
