export function initBookshelf() {
  const bookshelf = document.getElementById('bookshelf');

  // Dummy book data for now
  const books = [
    { title: 'The Circle', author: 'Dave Eggers' },
    { title: 'Progressive Capitalism', author: 'Joe Stiglitz' }
  ];

  books.forEach(book => {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book';
    bookDiv.innerHTML = `
      <div class="title-zone">${book.title}</div>
      <div class="author-zone">${book.author}</div>
    `;
    bookshelf.appendChild(bookDiv);

    bookDiv.addEventListener('click', () => {
      bookDiv.classList.toggle('expanded');
    });
  });
}
