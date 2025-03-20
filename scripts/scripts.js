// Firebase & Firestore setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// Create auth instance and provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const themeToggleBtn = document.getElementById('theme-toggle');
const bookshelf = document.getElementById("bookshelf-container");
const state = { 
  allBooks: [], 
  displayedBooks: [], 
  activeFilters: [], 
  maxFilters: 3, 
  user: null,
  isAdmin: false
};

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

function calculateSpineWidth(pageCount, title) {
  const minSpineWidth = 60;
  const maxSpineWidth = 160;
  const minPages = 100;
  const maxPages = 1200;

  if (!pageCount || pageCount < minPages) return minSpineWidth;

  const clampedPages = Math.min(pageCount, maxPages);
  const scale = (clampedPages - minPages) / (maxPages - minPages);
  const easedScale = Math.pow(scale, 0.65);

  const width = minSpineWidth + easedScale * (maxSpineWidth - minSpineWidth);

  if (title && title.length > 30) {
    return Math.max(minSpineWidth + 10, Math.round(width));
  }
  
  return Math.round(width);
}

function createFilterButtons() {
  const container = document.getElementById("filter-buttons");
  container.innerHTML = "";
  const tags = Object.keys(colorSystem.tagMap);

  tags.forEach(tag => {
    const button = document.createElement("button");
    button.className = "filter-button";
    button.textContent = tag;
    button.style.backgroundColor = `var(--${colorSystem.tagMap[tag]})`;

    button.addEventListener("click", () => {
      if (state.activeFilters.includes(tag)) {
        state.activeFilters = state.activeFilters.filter(t => t !== tag);
        button.classList.remove("selected");
      } else {
        if (state.activeFilters.length < state.maxFilters) {
          state.activeFilters.push(tag);
          button.classList.add("selected");
        } else {
          button.classList.add("shake");
          setTimeout(() => button.classList.remove("shake"), 300);
        }
      }
      renderBooks();
    });

    container.appendChild(button);
  });
  
  // Make sure the filter buttons are initially hidden
  container.classList.add('hidden');
}

// Updated loadBookData function 
async function loadBookData() {
  try {
    const snapshot = await getDocs(collection(db, "books"));
    const tags = new Set();
    
    state.allBooks = snapshot.docs.map(doc => {
      const data = doc.data();
      data.id = doc.id;
      console.log("Loaded book:", data.id, data.title);

      // Make sure contentTags exists (defensive coding)
      data.contentTags = data.contentTags || [];
      data.contentTags.forEach(tag => tags.add(tag));
      
      // Make sure status has a default value if not set
      data.readingStatus = data.readingStatus || "unread";
      
      return data;
    });
    
    // Set up the color mapping for tags
    [...tags].forEach((tag, index) => {
      colorSystem.tagMap[tag] = colorSystem.palette[index % colorSystem.palette.length];
    });
    
    createFilterButtons();
    renderBooks();
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

// Function to toggle filter buttons visibility
function setupFilterToggle() {
  const filterToggle = document.getElementById('filter-toggle');
  const filterButtons = document.getElementById('filter-buttons');
  
  filterToggle.addEventListener('click', () => {
    filterButtons.classList.toggle('hidden');
    
    // Update button text based on state
    if (filterButtons.classList.contains('hidden')) {
      filterToggle.textContent = 'Filter by Topic';
    } else {
      filterToggle.textContent = 'Hide Filters';
    }
  });
}

// Function to update book status in Firestore
async function updateBookStatus(bookId, newStatus) {
  console.log("Attempting to update book:", bookId);
  console.log("User is admin?", state.isAdmin);
  console.log("User email:", state.user ? state.user.email : "Not logged in");
  
  if (!state.isAdmin) {
    console.log("Sorry, only admins can update book status!");
    return;
  }
  
  try {
    const bookRef = doc(db, "books", bookId);
    // This is the magical part - setDoc with merge:true will create the field if it doesn't exist
    await setDoc(bookRef, {
      readingStatus: newStatus
    }, { merge: true });
    
    console.log(`Book ${bookId} status updated to ${newStatus}`);
    
    // Also update local data
    const bookIndex = state.allBooks.findIndex(b => b.id === bookId);
    if (bookIndex >= 0) {
      state.allBooks[bookIndex].readingStatus = newStatus;
    }
  } catch (error) {
    console.error("Error updating book status:", error);
  }
}
// Updated renderBooks function
function renderBooks() {
  const shelf = document.getElementById("bookshelf");
  shelf.innerHTML = "";
  const booksToShow = state.activeFilters.length ?
    state.allBooks.filter(book => state.activeFilters.every(tag => book.contentTags.includes(tag))) :
    [...state.allBooks];

  booksToShow.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";
    div.dataset.id = book.id; // Store the book ID in the element
    
    const spineWidth = calculateSpineWidth(book.pageCount, book.title);
    div.style.width = spineWidth + "px";
    div.style.minWidth = spineWidth + "px";
    div.style.setProperty('--spine-width', `${spineWidth}px`);
    
    const gradient = book.contentTags.slice(0, 3).map(tag => `var(--${colorSystem.tagMap[tag]})`).join(", ");
    div.style.setProperty('--gradient-colors', gradient);

    const titleEl = document.createElement("div");
    titleEl.className = "title-zone";
    titleEl.textContent = book.title;

    const authorEl = document.createElement("div");
    authorEl.className = "author-zone";
    authorEl.textContent = book.author;

    const expanded = document.createElement("div");
    expanded.className = "book-expanded-content";
    
    // Basic book info
    let expandedContent = `
      <h3>${book.title}</h3>
      <p><em>by ${book.author}</em></p>
      <p>${book.pageCount} pages | ${book.yearPublished || 'Unknown'}</p>
    `;
    
    // Only show status controls if user is admin
    if (state.isAdmin) {
      expandedContent += `
      <div class="status-selector">
        <h4>Reading Status:</h4>
        <div class="status-buttons">
          <button class="status-btn ${book.readingStatus === 'read' ? 'active' : ''}" 
                  data-status="read" data-book-id="${book.id}">Read</button>
          <button class="status-btn ${book.readingStatus === 'reading' ? 'active' : ''}" 
                  data-status="reading" data-book-id="${book.id}">Reading</button>
          <button class="status-btn ${book.readingStatus === 'unread' || !book.readingStatus ? 'active' : ''}" 
                  data-status="unread" data-book-id="${book.id}">Unread</button>
        </div>
      </div>
    `;
    
    } else {
      // For non-admins, just display the status
      const statusText = book.readingStatus ? book.readingStatus.charAt(0).toUpperCase() + book.readingStatus.slice(1) : "Unread";
      expandedContent += `<p class="book-status">Status: ${statusText}</p>`;
    }
    
    // Add summary if it exists
    if (book.summary) {
      expandedContent += `<p class="book-summary">${book.summary}</p>`;
    }
    
    expanded.innerHTML = expandedContent;

    if (book.title.length > 25) {
      titleEl.classList.add('long-title');
    } else if (book.title.length > 15) {
      titleEl.classList.add('medium-title');
    }

    div.appendChild(titleEl);
    div.appendChild(authorEl);
    div.appendChild(expanded);

    // Toggle expansion on click
    div.addEventListener("click", (e) => {
      if (!e.target.classList.contains('status-btn')) {
        div.classList.toggle("expanded");
        e.stopPropagation();
      }
    });
    
    // Add event listeners for status buttons
    if (state.isAdmin) {
      div.addEventListener("click", (e) => {
        if (e.target.classList.contains('status-btn')) {
          const newStatus = e.target.dataset.status;
          const bookId = e.target.dataset.bookId;
          
          // Update UI immediately for a snappier feel
          div.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === newStatus);
          });
          
          // Send the update to Firestore
          console.log("Current user:", state.user ? state.user.email : "Not logged in");
          console.log("Admin check result:", state.isAdmin);
          updateBookStatus(bookId, newStatus);
          e.stopPropagation();
        }
      });
    }

    // Hover effects (for desktop)
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

  // Close any open books when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".book")) {
      document.querySelectorAll(".book.expanded").forEach(b => b.classList.remove("expanded"));
    }
  });
}

// Authentication functions
function signInWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Success! You're in!
      console.log("Signed in!", result.user.email);
    })
    .catch((error) => {
      // Oops, something went wrong
      console.error("Auth error:", error);
    });
}

function signOutUser() {
  auth.signOut().then(() => {
    console.log("Signed out!");
  });
}

// Check if user is an admin
function checkAdminStatus(email) {
  console.log("Checking if admin:", email);
  const adminEmails = ["robertdlawrence1@gmail.com"]; 
  const isAdmin = adminEmails.includes(email);
  console.log("Is admin?", isAdmin);
  return isAdmin;
}

// Update UI based on auth state
function updateAuthUI() {
  const authContainer = document.getElementById("auth-container");
  
  if (state.user) {
    authContainer.innerHTML = `
      <div class="user-info">
        <span>Hi, ${state.user.displayName || state.user.email}</span>
        ${state.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
        <button id="sign-out-btn" class="auth-btn">Sign Out</button>
      </div>
    `;
    document.getElementById("sign-out-btn").addEventListener("click", signOutUser);
  } else {
    authContainer.innerHTML = `
      <button id="sign-in-btn" class="auth-btn">Sign In with Google</button>
    `;
    document.getElementById("sign-in-btn").addEventListener("click", signInWithGoogle);
  }
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    state.user = user;
    state.isAdmin = checkAdminStatus(user.email);
    updateAuthUI();
    // Refresh books to show edit controls if admin
    renderBooks();
  } else {
    // User is signed out
    state.user = null;
    state.isAdmin = false;
    updateAuthUI();
    renderBooks();
  }
});

// Initialize everything when the page loads
document.addEventListener("DOMContentLoaded", () => {
  updateThemeIcon();
  loadBookData();
  updateAuthUI(); // Add auth UI
  setupFilterToggle(); // Add this line to set up the filter toggle
});