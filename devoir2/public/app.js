const apiBase = '/api/books';

async function fetchBooks() {
  const res = await fetch(apiBase);
  return res.json();
}

function bookCard(book) {
  const percent = book.pages ? Math.round((book.pagesRead / book.pages) * 100) : 0;
  return `
    <div class="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <div class="text-lg font-semibold">${escapeHtml(book.title)} <span class="text-sm text-gray-500">by ${escapeHtml(book.author || 'Unknown')}</span></div>
        <div class="text-sm text-gray-600">Pages: ${book.pages} — Read: ${book.pagesRead} — Format: ${book.format} — Price: ${book.price} MAD</div>
        <div class="mt-2">
          <div class="text-sm">Status: <strong>${book.status}</strong> — Finished: ${book.finished ? 'Yes' : 'No'}</div>
          <div class="w-full bg-gray-200 rounded h-3 mt-2 overflow-hidden">
            <div style="width:${percent}%" class="h-full bg-green-500"></div>
          </div>
          <div class="text-xs text-gray-600 mt-1">${percent}%</div>
        </div>
      </div>
      <div class="mt-3 md:mt-0 flex gap-2">
        <button onclick="setPagesRead('${book._id}')" class="px-3 py-1 border rounded">Set pages read</button>
        <button onclick="deleteBook('${book._id}')" class="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

async function refresh() {
  const list = document.getElementById('booksList');
  list.innerHTML = 'Loading...';
  const books = await fetchBooks();

  // summary
  const totalBooks = books.length;
  const finishedBooks = books.filter(b => b.finished).length;
  const totalPagesRead = books.reduce((a,b) => a + (Number(b.pagesRead)||0), 0);

  document.getElementById('totalBooks').innerText = totalBooks;
  document.getElementById('finishedBooks').innerText = finishedBooks;
  document.getElementById('totalPagesRead').innerText = totalPagesRead;

  if (!books.length) {
    list.innerHTML = `<div class="bg-white p-4 rounded shadow text-gray-500">No books yet.</div>`;
    return;
  }
  list.innerHTML = books.map(bookCard).join('\n');
}

document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    title: form.title.value.trim(),
    author: form.author.value.trim(),
    pages: Number(form.pages.value) || 0,
    pagesRead: Number(form.pagesRead.value) || 0,
    status: form.status.value,
    price: Number(form.price.value) || 0,
    format: form.format.value,
    suggestedBy: form.suggestedBy.value.trim()
  };

  // finished logic is handled on server
  await fetch(apiBase, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  form.reset();
  refresh();
});

async function deleteBook(id) {
  if (!confirm('Delete this book?')) return;
  await fetch(apiBase + '/' + id, { method: 'DELETE' });
  refresh();
}

async function setPagesRead(id) {
  const input = prompt('Enter pages read (number):');
  if (input === null) return;
  const val = Number(input);
  if (Number.isNaN(val) || val < 0) return alert('Invalid number');
  await fetch(apiBase + '/' + id, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ pagesRead: val })
  });
  refresh();
}

window.onload = refresh;
