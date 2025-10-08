const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Centralized Configuration ---
const { connect } = require("./lib/db");
const User = require('./models/User'); // Ensure User model is loaded

// Connect to the database immediately
connect();

const app = express();

// --- Robust Middleware Setup ---
// This handles the browser's pre-flight requests and is more reliable.
app.use(cors({ origin: '*' }));
app.use(express.static('public'));
app.use(express.json());


// --- Direct API Route Handling ---

// 1. REGISTRATION LOGIC
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).send('Email and password are required');
    }
    console.log(`Registration attempt for: ${email}`);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`Registration successful for: ${email}`);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error(`Registration Error for ${req.body.email}:`, error.message);
    // 11000 is the error code for a duplicate key (i.e., email already exists)
    if (error.code === 11000) {
        return res.status(409).send('This email address is already registered.');
    }
    res.status(500).send('An internal server error occurred during registration.');
  }
});

// 2. LOGIN LOGIC
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send('Email and password are required.');
    }
    console.log(`Login attempt for email: [${email}]`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found for email [${email}]`);
      return res.status(401).send('Authentication failed.');
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`Login failed: Password does not match for user [${email}]`);
      return res.status(401).send('Authentication failed.');
    }
    console.log(`Login successful for user [${email}]`);
    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('FATAL LOGIN ERROR:', err);
    res.status(500).send('An internal server error occurred.');
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Start other providers if needed
require("./lib/providers/discord");
require("./lib/providers/telegram");
