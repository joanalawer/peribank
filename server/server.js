const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const path = require('path');
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'pages')));

app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// // PostgreSQL connection setup
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'userdb',
//     // password: 'admin',
//     port: 5432,
// });

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));  // Serve the HTML file
});
app.get('/', (req, res) => {
    res.render('index');
  });

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('login', (req, res) => {
    res.render('login');
});

app.get('/profile', (req, res) => {
    res.render('profile');
});

app.get('/balance', (req, res) => {
    res.render('balance');
});

app.get('/deposit', (req, res) => {
    res.render('deposit');
});

app.get('/withdraw', (req, res) => {
    res.render('withdraw');
});

app.get('/transfer', (req, res) => {
    res.render('transfer');
});

app.get('/close_account', (req, res) => {
    res.render('close_account');
});

app.get('/logout', (req, res) => {
    res.render('index');
});

  
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Query to fetch user data
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid Username or Password');
        }

        const user = result.rows[0];

        // Compare the hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).send('Invalid Username or Password');
        }

        // If valid, redirect to the dashboard or desired page
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/profile', (req, res) => {
    res.send('Welcome to your dashboard!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
