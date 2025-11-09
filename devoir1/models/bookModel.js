const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: '' },
  pages: { type: Number, required: true, min: 1 },
  pagesRead: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['Read','Re-read','DNF','Currently reading','Returned Unread','Want to read'],
    default: 'Want to read'
  },
  price: { type: Number, default: 0 },
  format: { type: String, enum: ['Print','PDF','Ebook','AudioBook'], default: 'Print' },
  suggestedBy: { type: String, default: '' },
  finished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
