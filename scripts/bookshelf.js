import { db } from './auth.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initBookshelf() {
  const bookshelf = document.getElementById('bookshelf');

  async function fetchBooks() {
    const querySnapshot = await getDocs(collection(db, "books"));
    querySnapshot.forEach((docSnap) => {
      const bookData = docSnap.data();
      const docId = docSnap.id;
      const bookTags = bookData.contentTags || [];

      // Convert tags for CSS variables
      const formattedTags = bookTags.map(tag => tag.replace(/\s+/g, '-'));
      const gradientColors = formattedTags.map(tag => `var(--${tag})`).join(', ');

      // Dynamic width based on pageCount (min 80px, max 160px)
      const pages = bookData.pageCount || 200;
      
      // New: adjustable scale factor
      const baseWidth = 70; // minimum base width
      const scaleFactor = 0.12; // fine-tune this for how "fast" spines widen
      const calculatedWidth = baseWidth + (pages * scaleFactor);
      
      // Clamp result between 80px and 160px:
      const width = Math.min(160, Math.max(80, calculatedWidth));

      const bookDiv = document.createElement('div');
      bookDiv.className = 'book';
      bookDiv.dataset.tags = formattedTags.join(',');
      bookDiv.style.setProperty('--gradient-colors', gradientColors);
      bookDiv.style.setProperty('--spine-width', `${width}px`);

      bookDiv.innerHTML = `
        <div class="title-zone">${bookData.title}</div>
        <div class="author-zone">${bookData.author}</div>
        <div class="book-expanded-content">
          <h3>${bookData.title}</h3>
          <p><em>by ${bookData.author}</em></p>
          <p><small>${pages} pages | ${bookData.yearPublished || ''}</small></p>
          <div class="status-selector">
            <h4>Reading Status:</h4>
            <div class="status-buttons">
              <button class="status-btn" data-status="Unread">Unread</button>
              <button class="status-btn" data-status="Reading">Reading</button>
              <button class="status-btn" data-status="Read">Read</button>
            </div>
          </div>
          <p>${bookData.summary || 'No summary available.'}</p>
        </div>
      `;

      // Click/hover behavior stays the same
      bookDiv.addEventListener('click', (e) => {
        if (window.matchMedia('(hover: hover)').matches) return;
        if (e.target.closest('.status-btn')) return;
        bookDiv.classList.toggle('expanded');
      });

      bookshelf.appendChild(bookDiv);

      // Status logic stays the same...
      const statusBtns = bookDiv.querySelectorAll('.status-btn');
      if (bookData.readingStatus) {
        statusBtns.forEach(btn => {
          if (btn.dataset.status.toLowerCase() === bookData.readingStatus.toLowerCase()) {
            btn.classList.add('active');
          }
        });
      }

      statusBtns.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          statusBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          await updateDoc(doc(db, "books", docId), {
            readingStatus: btn.dataset.status
          });
        });
      });
    });
  }

  fetchBooks();
}
