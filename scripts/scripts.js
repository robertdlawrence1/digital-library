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
  // Base values
  const minSpineWidth = 28;  // Thinnest possible spine
  const maxSpineWidth = 85;  // Thickest possible spine
  const minPages = 50;       // Minimum page count threshold
  const maxPages = 1200;     // Maximum page count threshold

  if (!pageCount || pageCount < minPages) return minSpineWidth;

  // Map the page count to our desired range
  let normalizedPages = Math.min(Math.max(pageCount, minPages), maxPages);
  
  // Use a non-linear scale with power curve instead of logarithmic
  // This gives a more natural progression of spine widths
  
  // First, calculate the base percentage of the range
  const basePercentage = (normalizedPages - minPages) / (maxPages - minPages);
  
  // Then apply a power function to create a curve
  // Values less than 1 create a curve that grows quickly at first, then slows down
  // Values greater than 1 create a curve that starts slow, then accelerates
  const curveStrength = 0.65; // Adjust this value to change the curve shape
  const adjustedPercentage = Math.pow(basePercentage, curveStrength);
  
  // Calculate spine width
  const spineWidth = minSpineWidth + adjustedPercentage * (maxSpineWidth - minSpineWidth);
  
  // Add a small random variation to make the bookshelf look more natural
  // Range is +/- 2px but weighted toward center (multiplying random values)
  const variation = (Math.random() - 0.5) * (Math.random() * 3);
  
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
 * Enhanced Text Fitting for Book Spines
 ****************************************************/
function improvedTextFitting(el, minFontSize = 9, maxFontSize = 16) {
  if (!el) return;
  const container = el.parentElement;
  if (!container) return;
  
  // Reset any existing font size to start fresh
  el.style.fontSize = '';
  
  // Get the original text content
  const originalText = el.textContent;
  const isVertical = el.classList.contains('vertical');
  
  // Different approaches for vertical vs horizontal text
  if (isVertical) {
    // For vertical text, we focus more on height constraints
    let fontSize = maxFontSize;
    el.style.fontSize = fontSize + 'px';
    
    // Reduce font size until text fits
    while ((el.scrollHeight > container.clientHeight * 0.75 || el.scrollWidth > container.clientWidth) && fontSize > minFontSize) {
      fontSize -= 0.5;
      el.style.fontSize = fontSize + 'px';
    }
    
    // If text still doesn't fit, we need to truncate
    if (el.scrollHeight > container.clientHeight * 0.75 && originalText.length > 12) {
      // Calculate approximately how many characters we can fit
      const approxCharsPerHeight = Math.floor((container.clientHeight * 0.75) / (fontSize * 1.2));
      if (approxCharsPerHeight < originalText.length) {
        el.textContent = originalText.substring(0, approxCharsPerHeight - 3) + '...';
      }
    }
  } else {
    // For horizontal text, width is usually the constraint
    let fontSize = maxFontSize;
    el.style.fontSize = fontSize + 'px';
    
    // Check if title fits in container
    while ((el.scrollWidth > container.clientWidth || el.scrollHeight > container.clientHeight * 0.75) && fontSize > minFontSize) {
      fontSize -= 0.5;
      el.style.fontSize = fontSize + 'px';
    }
    
    // If font is at minimum and still overflowing, truncate with ellipsis
    if ((el.scrollWidth > container.clientWidth || el.scrollHeight > container.clientHeight * 0.75) && originalText.length > 8) {
      // Calculate approximately how many characters we can fit
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || fontSize * 1.2;
      const availableLines = Math.floor((container.clientHeight * 0.75) / lineHeight);
      const charsPerLine = Math.floor(container.clientWidth / (fontSize * 0.6));
      const totalChars = availableLines * charsPerLine;
      
      if (totalChars < originalText.length) {
        el.textContent = originalText.substring(0, totalChars - 3) + '...';
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

  // Set spine width based on page count
  const spineWidth = calculateSpineWidth(book.pageCount);
  bookDiv.style.width = spineWidth + "px";
  bookDiv.style.minWidth = spineWidth + "px";

  // Use hue averaging from contentTags for book color
  let bgColor;
  if (Array.isArray(book.contentTags) && book.contentTags.length > 0) {
    const avgHue = averageHue(book.contentTags);
    // Adjust saturation and lightness as needed for legibility
    bgColor = `hsl(${avgHue}, 60%, 50%)`;
  } else {
    // Fallback to a default color if no tags
    bgColor = colorSystem.defaultColors[Math.floor(Math.random() * colorSystem.defaultColors.length)];
  }
  bookDiv.style.background = bgColor;
  bookDiv.style.color = "#fff";

  // Decide if title text should be vertical based on its length
  const titleThreshold = 50;
  const isLongTitle = book.title.length > titleThreshold;
  const titleClass = isLongTitle ? "title-zone vertical" : "title-zone horizontal";

  // Build the spine's HTML
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

  // Toggle expanded view on click
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

  // Decide if title text should be vertical based on spine width and title length
  const spineWidth = calculateSpineWidth(book.pageCount);
  const titleThreshold = spineWidth < 45 ? 12 : 25; // Different threshold based on spine width
  const isVerticalTitle = book.title.length > titleThreshold || spineWidth < 40;
  const titleClass = isVerticalTitle ? "title-zone vertical" : "title-zone horizontal";
  
  // ... rest of existing code ...
  
  // Call improved text fitting instead of the old fitTextToContainer
  const titleEl = bookDiv.querySelector('.title-zone');
  const authorEl = bookDiv.querySelector('.author-zone');
  improvedTextFitting(titleEl);
  improvedTextFitting(authorEl, 8, 14); // Slightly different params for author text
  
  return bookDiv;
}

/****************************************************
 * Render Books
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

  // Adjust text size if necessary to ensure it fits within the spine
  const allBooks = document.querySelectorAll('.book');
  allBooks.forEach(bookEl => {
    const titleEl = bookEl.querySelector('.title-zone');
    const authorEl = bookEl.querySelector('.author-zone');
    fitTextToContainer(titleEl);
    fitTextToContainer(authorEl);
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
