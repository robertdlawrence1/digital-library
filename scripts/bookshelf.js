// ✅ Imports should go here, outside the function
import { db } from './auth.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initBookshelf() {
  const bookshelf = document.getElementById('bookshelf');

  async function fetchBooks() {
    const querySnapshot = await getDocs(collection(db, "books"));
    querySnapshot.forEach((docSnap) => {
      const bookData = docSnap.data();
      const docId = docSnap.id;

      const bookDiv = document.createElement('div');
      bookDiv.className = 'book';
      bookDiv.innerHTML = `
        <div class="title-zone">${bookData.title}</div>
        <div class="author-zone">${bookData.author}</div>
        <div class="book-expanded-content">
          <h3>${bookData.title}</h3>
          <p><em>by ${bookData.author}</em></p>
          <p>${bookData.description || 'No description available.'}</p>
          <div class="status-selector">
            <h4>Reading Status</h4>
            <div class="status-buttons">
              <button class="status-btn" data-status="To Read">To Read</button>
              <button class="status-btn" data-status="Reading">Reading</button>
              <button class="status-btn" data-status="Completed">Completed</button>
            </div>
          </div>
        </div>
      `;

      bookDiv.addEventListener('click', (e) => {
        // Skip click-to-expand on desktop (since desktop uses hover)
        if (window.matchMedia('(hover: hover)').matches) return;
        if (e.target.closest('.status-btn')) return;
        bookDiv.classList.toggle('expanded');
      });

      bookshelf.appendChild(bookDiv);

      const statusBtns = bookDiv.querySelectorAll('.status-btn');
      if (bookData.status) {
        statusBtns.forEach(btn => {
          if (btn.dataset.status === bookData.status) {
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
            status: btn.dataset.status
          });
          console.log(`Updated status for "${bookData.title}" to "${btn.dataset.status}"`);
        });
      });
    });
  }

  fetchBooks();
}
