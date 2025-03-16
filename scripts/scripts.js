// scripts.js
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
     * Color Theme System
     ****************************************************/
    const colorSystem = {
      // Map for tag colors - will be populated dynamically
      tagColors: {},
      
      // Colorful palette for tag assignments
      colorPalette: [
        "#3d5a80", // Blue
        "#7d4e57", // Burgundy
        "#41729f", // Steel blue
        "#5e3023", // Brown
        "#354f52", // Forest green
        "#5e548e", // Purple
        "#028090", // Teal
        "#d62828", // Red
        "#4a4e69", // Slate
        "#687864", // Olive
        "#5f0f40", // Wine
        "#9e2a2b", // Crimson
        "#323031", // Dark gray
        "#540b0e", // Dark red
        "#e09f3e", // Gold
        "#335c67"  // Navy
      ],
  
      // Default colors for books with no matching tags
      defaultColors: ["#8B4513", "#A0522D", "#6B4226", "#855E42"],
      
      // Initialize tag colors from available tags
      initializeTagColors(tags) {
        // Reset the tag colors map
        this.tagColors = {};
        
        // Assign colors to tags
        tags.forEach((tag, index) => {
          this.tagColors[tag] = this.colorPalette[index % this.colorPalette.length];
        });
      },
      
      // Generate color for a book based on its tags
      generateBookColor(tags) {
        if (!Array.isArray(tags) || tags.length === 0) {
          return this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
        }
        
        // Get colors for this book's tags
        const colors = tags
          .map(tag => this.tagColors[tag])
          .filter(color => color !== undefined);
        
        if (colors.length === 0) {
          return this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
        }
        
        if (colors.length === 1) {
          return colors[0];
        }
        
        // For multiple colors, create a gradient
        return `linear-gradient(135deg, ${colors.join(', ')})`;
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
  
  // Remove these lines that overwrite your SVG icons:
  // const themeToggle = document.getElementById('theme-toggle');
  // if (themeToggle) {
  //   themeToggle.textContent = state.isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  // }
  
  // Update filter button styling
  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach(btn => {
    // Rest of your filter button code...
  });
  
  // Re-render books for dark mode appearance updates
  renderBooks();
}

    /****************************************************
     * Spine Width Calculation
     ****************************************************/
    
function calculateSpineWidth(pageCount) {
      const minSpineWidth = 30;
      const maxSpineWidth = 90;
      const minPages = 100;  // Minimum page count threshold
      const maxPages = 1000;   // Max pages threshold
    
      if (!pageCount) return minSpineWidth;
    
      // Clamp page count to between minPages and maxPages
      const normalizedPages = Math.min(Math.max(pageCount, minPages), maxPages);
    
      // Linear interpolation for spine width
      const spineWidth = minSpineWidth + ((normalizedPageCount - minPages) / (maxPages - minPages)) * (maxSpineWidth - minSpineWidth);
    
      return Math.round(spineWidth);
    }

    /****************************************************
     * fitTextToContainer: Reduce font-size if the content
     * is larger than its container. We keep shrinking until
     * it fits or we hit a minimum font size.
     ****************************************************/
    function fitTextToContainer(el, minFontSize = 8) {
      if (!el) return;
      const container = el.parentElement;
      if (!container) return;

      let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      for (let i = 0; i < 50; i++) {
        // If the content overflows horizontally or vertically, shrink
        if (
          el.scrollWidth > container.clientWidth ||
          el.scrollHeight > container.clientHeight
        ) {
          if (fontSize <= minFontSize) break;
          fontSize -= 1;
          el.style.fontSize = fontSize + "px";
        } else {
          break;
        }
      }
    }

    /****************************************************
     * Create Book Element
     ****************************************************/
    function createBookElement(book) {
      const bookDiv = document.createElement("div");
      bookDiv.className = "book";

      // Spine width based on page count
      const spineWidth = calculateSpineWidth(book.pageCount);
      bookDiv.style.width = spineWidth + "px";
      bookDiv.style.minWidth = spineWidth + "px";
      
      // Apply tag-based colors
      const bookColor = colorSystem.generateBookColor(book.contentTags);
      bookDiv.style.background = bookColor;

      // Title threshold
      const titleThreshold = 50;
      const isLongTitle = book.title.length > titleThreshold;
      const titleClass = isLongTitle ? "title-zone vertical" : "title-zone horizontal";

      // Build spine
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

      // Toggle expanded view
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

      // Create each book
      state.displayedBooks.forEach(book => {
        const bookElement = createBookElement(book);
        shelf.appendChild(bookElement);
      });

      // After creation, fit text in each zone
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

  // Sort tags alphabetically
  const sortedTags = Array.from(allTags).sort();
  
  // Initialize color system with all available tags
  colorSystem.initializeTagColors(sortedTags);

  // Create filter buttons
  sortedTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = tag;
    
    const tagColor = colorSystem.getTagColor(tag);
    btn.style.borderColor = tagColor;
    btn.style.borderLeft = `6px solid ${tagColor}`;
    
    // Apply proper theme styling
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
    // Unselect the filter
    state.activeFilters = state.activeFilters.filter(t => t !== tag);
    buttonElement.classList.remove("selected");
    
    // Reset the button appearance
    buttonElement.style.backgroundColor = state.isDarkMode ? "#333" : "#eee";
    buttonElement.style.color = state.isDarkMode ? "#ddd" : "#333";
    buttonElement.style.borderColor = colorSystem.getTagColor(tag);
    buttonElement.style.borderLeft = `6px solid ${colorSystem.getTagColor(tag)}`;
  } else {
    // Check max filters
    if (state.activeFilters.length >= state.maxFilters) return;
    
    // Select the filter
    state.activeFilters.push(tag);
    buttonElement.classList.add("selected");
    
    // Apply the tag color to the selected button
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
      // Initialize theme toggle
      const themeToggleBtn = document.getElementById('theme-toggle');
      themeToggleBtn.addEventListener('click', toggleDarkMode);
      
      // Apply initial theme based on user preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleDarkMode();
      }
      
      // Load book data from Firestore
      loadBookData();
    });
