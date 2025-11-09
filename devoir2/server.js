const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('./config/passport');

const BookClass = require('./models/bookClass'); // wrapper/class (see file)
const BookModel = require('./models/bookModel'); // mongoose model
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// --- replace with your MongoDB URI ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/booktracker';

// connect
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('Mongo error:', err));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// serve static frontend
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRoutes);

// --- API routes ---

// create book
app.post('/api/books', async (req, res) => {
  try {
    const payload = req.body;
    // Create BookClass instance then save to DB
    const book = new BookClass(payload);
    const saved = await book.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// list all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await BookModel.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update pagesRead (currentlyAt) or other fields
app.patch('/api/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body; // { pagesRead: 50 } or other
    const bookDoc = await BookModel.findById(id);
    if (!bookDoc) return res.status(404).json({ error: 'Not found' });

    // Use BookClass wrapper to keep logic
    const book = new BookClass(bookDoc.toObject());
    book._id = bookDoc._id;
    if (typeof updates.pagesRead !== 'undefined') {
      await book.currentlyAt(Number(updates.pagesRead));
      const updatedDoc = await BookModel.findById(book._id);
      return res.json(updatedDoc);
    }

    // generic update: update allowed fields
    const allowed = ['title','author','pages','status','price','format','suggestedBy'];
    allowed.forEach(f => {
      if (updates[f] !== undefined) bookDoc[f] = updates[f];
    });
    // finished logic
    if (bookDoc.pagesRead >= bookDoc.pages) bookDoc.finished = true;
    else bookDoc.finished = false;

    await bookDoc.save();
    res.json(bookDoc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete
app.delete('/api/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await BookModel.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on', PORT));
