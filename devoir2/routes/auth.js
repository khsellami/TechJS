const express = require('express');
const passport = require('passport');
const User = require('../models/userModel');
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Home page - redirect to login if not authenticated, books if authenticated
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/books');
  }
  res.redirect('/login');
});

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Login',
    messages: req.flash()
  });
});

// Login POST
router.post('/login', passport.authenticate('local', {
  successRedirect: '/books',
  failureRedirect: '/login',
  failureFlash: true
}));

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', {
    title: 'Register',
    messages: req.flash()
  });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      req.flash('error', 'User with this email or username already exists');
      return res.redirect('/register');
    }
    
    // Create new user
    const user = new User({ username, email, password });
    await user.save();
    
    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/login');
    
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

// Books page (protected)
router.get('/books', isAuthenticated, (req, res) => {
  res.render('books', {
    title: 'My Books',
    user: req.user,
    messages: req.flash()
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Logout GET (for convenience)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;