const express = require('express');
const argon2 = require('argon2');
const pool = require('../db');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = await argon2.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, email]
    );

    res.json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await argon2.verify(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
