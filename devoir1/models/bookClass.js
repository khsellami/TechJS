// Book class wrapper using the Mongoose model for persistence.
// Methods: constructor, currentlyAt(pagesRead), deleteBook()

const BookModel = require('./bookModel');

class Book {
  // payload: {title, author, pages, pagesRead, status, price, format, suggestedBy}
  constructor(payload = {}) {
    this.title = payload.title || '';
    this.author = payload.author || '';
    this.pages = Number(payload.pages || 0);
    this.pagesRead = Number(payload.pagesRead || 0);
    this.status = payload.status || 'Want to read';
    this.price = Number(payload.price || 0);
    this.format = payload.format || 'Print';
    this.suggestedBy = payload.suggestedBy || '';
    this.finished = (this.pages > 0 && this.pagesRead >= this.pages) || false;
    // _id may be set later when loaded from DB
    if (payload._id) this._id = payload._id;
  }

  async save() {
    // save new document
    const doc = new BookModel({
      title: this.title,
      author: this.author,
      pages: this.pages,
      pagesRead: this.pagesRead,
      status: this.status,
      price: this.price,
      format: this.format,
      suggestedBy: this.suggestedBy,
      finished: this.finished
    });
    const saved = await doc.save();
    this._id = saved._id;
    return saved;
  }

  // set pagesRead (currentlyAt) and update finished flag
  async currentlyAt(pagesRead) {
    if (typeof pagesRead !== 'number') pagesRead = Number(pagesRead);
    if (pagesRead < 0) pagesRead = 0;
    if (this._id) {
      const doc = await BookModel.findById(this._id);
      if (!doc) throw new Error('Book not found');
      doc.pagesRead = pagesRead;
      doc.finished = (doc.pages > 0 && doc.pagesRead >= doc.pages);
      // optionally update status to 'Read' if finished
      if (doc.finished && doc.status !== 'Read') doc.status = 'Read';
      await doc.save();
      // update instance
      this.pagesRead = doc.pagesRead;
      this.finished = doc.finished;
      return doc;
    } else {
      // not yet saved: update local instance
      this.pagesRead = pagesRead;
      this.finished = (this.pages > 0 && this.pagesRead >= this.pages);
      if (this.finished) this.status = 'Read';
      return this;
    }
  }

  // delete the book from DB
  async deleteBook() {
    if (!this._id) throw new Error('No _id to delete');
    await BookModel.findByIdAndDelete(this._id);
    return true;
  }
}

module.exports = Book;
