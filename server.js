const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Centralized Configuration ---
const { connect } = require("./lib/db");
const User = require('./models/User');
const { requireAuth } = require('./lib/auth'); // <-- Import auth middleware

// Connect to the database immediately
connect();

const app = express();

// --- Middleware Setup ---
app.use(cors({ origin: '*' }));
app.use(express.static('public'));
app.use(express.json());


// --- AUTHENTICATION ROUTES (Public) ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).send('Email and password are required');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).send('This email address is already registered.');
    res.status(500).send('An internal server error occurred.');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('Email and password are required.');
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Authentication failed.');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).send('Authentication failed.');
    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).send('An internal server error occurred.');
  }
});


// --- APPLICATION ROUTES (Protected) ---
// We use a router to apply the requireAuth middleware to all /api/app routes
const appRouter = express.Router();
appRouter.use(requireAuth); // Protect all routes in this router

// Now, define the routes on the router
appRouter.get('/thread', require('./api/app/thread'));
appRouter.get('/message', require('./api/app/message'));
appRouter.post('/send', require('./api/app/send'));
appRouter.post('/link', require('./api/app/link'));

// Mount the protected router
app.use('/api/app', appRouter);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
