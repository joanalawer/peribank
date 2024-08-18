const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
// const { Pool } = require('pg');
const { pool } = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config();
const path = require('path');


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));  // Serve the HTML file
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));  // Serve the HTML file
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'about.html'));  // Serve the HTML file
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'services.html'));  // Serve the HTML file
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'contact.html'));  // Serve the HTML file
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'register.html'));  // Serve the HTML file
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));  // Serve the HTML file
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'profile.html'));  // Serve the HTML file
});

app.get('/balance', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'balance.html'));  // Serve the HTML file
});

app.get('/deposit', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'deposit.html'));  // Serve the HTML file
});

app.get('/withdraw', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'withdraw.html'));  // Serve the HTML file
});

app.get('/transfer', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'transfer.html'));  // Serve the HTML file
});

app.get('/close_account', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'close_account.html'));  // Serve the HTML file
});

app.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));  // Serve the HTML file
});

app.post('/register', async (req, res) => {
    let { username, email, password, password2 } = req.body;
    console.log({
        username, email, password, password2
    });

    let errors = [];
    if (!username || !email || !password || !password2) {
        errors.push({ message: 'Please enter all fields'});
    }
    if (password.length < 8) {
        errors.push({ message: 'Password should be at least 8 characters'});
    }
    if (password != password2) {
        errors.push({ message: 'Passwords do not match'});
    }
    if (errors.length > 0) {
        // Convert errors to a string and pass it as a query parameter
        const query = errors.map(err => `message=${encodeURIComponent(err.message)}`).join('&');
        res.redirect(`/register?${query}`);
    }else{
        // Hash password
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users
              WHERE email = $1`,
            [email],
            (err, results) => {
              if (err) {
                console.error(err.message);
                return res.status(500).send('Server error');
              }
              console.log(results.rows);
      
              if (results.rows.length > 0) {
                return res.redirect('/register?message=Email+already+exists');
              }
            }
        );
    }
});
  
// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     // Query to fetch user data
//     const query = 'SELECT * FROM users WHERE username = $1';
//     const values = [username];

//     try {
//         const result = await pool.query(query, values);

//         if (result.rows.length === 0) {
//             return res.status(401).send('Invalid Username or Password');
//         }

//         const user = result.rows[0];

//         // Compare the hashed password
//         const match = await bcrypt.compare(password, user.password);
//         if (!match) {
//             return res.status(401).send('Invalid Username or Password');
//         }

//         // If valid, redirect to the dashboard or desired page
//         res.redirect('/profile');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// });

app.get('/profile', (req, res) => {
    res.send('Welcome to your dashboard!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
