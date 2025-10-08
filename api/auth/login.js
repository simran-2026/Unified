const { connect } = require('../../lib/db');
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const { sign } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    if (!req.body) {
      console.error("Login Error: Request body is missing.");
      return res.status(400).send('Bad Request: Missing login credentials.');
    }
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log(`Login attempt failed: Email or password was not provided. Email: [${email}]`);
      return res.status(400).send('Email and password are required.');
    }

    await connect();
    console.log(`Login attempt for email: [${email}]`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found for email [${email}]`);
      return res.status(401).send('Authentication failed: User not found or incorrect password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`Login failed: Password does not match for user [${email}]`);
      return res.status(401).send('Authentication failed: User not found or incorrect password.');
    }

    // If everything is correct, log success and send the token
    console.log(`Login successful for user [${email}]`);
    res.json({ token: sign(user), user: { id: user._id, email: user.email } });

  } catch (err) {
    console.error('FATAL LOGIN ERROR:', err);
    res.status(500).send('An internal server error occurred.');
  }
};
