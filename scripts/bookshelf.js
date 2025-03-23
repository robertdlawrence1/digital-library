import { db } from './auth.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { formatTagForCSS } from './utils.js';

export function initBookshelf() {
  const bookshelf = document.getElementById('bookshelf');

  async function fetchBooks() {
    const querySnapshot = await getDocs(collection(db, "books"));
    querySnapshot.forEach((docSnap) => {
      const bookData = docSnap.data();
      const docId = docSnap.id;
      const bookTags = bookData.contentTags || [];

      const formattedTags = bookTags.map(tag => formatTagForCSS(tag));
      const gradientColors = formattedTags.map(tag => `var(--${tag})`).join(', ');
      const borderColor = formattedTags.length > 0 ? `var(--${formattedTags[0]})` : '#ccc';

      const pages = bookData.pageCount || 200;
      const baseWidth = 70;
      const scaleFactor = 0.12;
      const calculatedWidth = baseWidth + (pages * scaleFactor);
      const width = Math.min(160, Math.max(80, calculatedWidth));

      const bookDiv = document.createElement('div');
      bookDiv.className = 'book';
      bookDiv.dataset.tags = formattedTags.join(',');
      bookDiv.style.setProperty('--gradient-colors', gradientColors);
      bookDiv.style.setProperty('--spine-width', `${width}px`);
      bookDiv.style.setProperty('--gradient-border-color', borderColor);

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

      bookDiv.addEventListener('click', (e) => {
        if (window.matchMedia('(hover: hover)').matches) return;
        if (e.target.closest('.status-btn')) return;
        bookDiv.classList.toggle('expanded');
      });

      bookshelf.appendChild(bookDiv);

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

    // MAKE SURE filter callback is available AFTER books are rendered:
    window.filterChangeCallback = function(selectedTags) {
      const allBooks = document.querySelectorAll('.book');
      allBooks.forEach(book => {
        const bookTags = (book.dataset.tags || '').split(',').filter(Boolean);
        const matches = selectedTags.every(tag => bookTags.includes(tag));
        book.style.display = (matches || selectedTags.length === 0) ? 'flex' : 'none';
      });
    };
  }

  fetchBooks();
}
