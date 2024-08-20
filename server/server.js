const express = require('express');
const path = require('path');
const app = express();
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();


// Set EJS as the templating engine for .html files
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// Set the views directory to /pages
app.set('views', path.join(__dirname, 'pages'));

// Serve static files from /public directory
// app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.static(path.join(__dirname, 'public')));



app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
    // cookie: { secure: false }
}));

// Initialise flash middleware
app.use(flash());

// Middleware to make flash messages available in templates
app.use ((req, res, next) => {
    res.locals.successMessage = req.flash('success-message');
    res.locals.errorMessage = req.flash('error-message');
    next();
});

const PORT = process.env.PORT || 3000;

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));  // Serve the HTML file
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'about.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'services.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'contact.html'));
});

app.get('/register', (req, res) => {
    res.render(path.join(__dirname, 'pages', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'profile.html'));
});

app.get('/balance', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'balance.html'));
});

app.get('/deposit', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'deposit.html'));
});

app.get('/withdraw', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'withdraw.html'));
});

app.get('/transfer', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'transfer.html'));
});

app.get('/close_account', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'close_account.html'));
});

app.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.post('/register', async (req, res) => {
    let { username, email, password, password2 } = req.body;

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
        // Render the register page with error messages
        req.flash('error-message', errors.map(err => err.message).join(', '));
        return res.redirect('/register');
    }
    else {
        try {
        // Check if email already exists
            pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

            if (results.rows.length > 0) {
                req.flash('error-message', 'Email already exists!');
                return res.redirect('/register');
            }

            // Hass password
            let hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user into the database
            pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
         );
            
            req.flash('success-message', 'Registration Successful! Please Login');
            res.redirect('/login');
        } catch (err) {
            console.error(err.message);
            req.flash('error-message', 'Server error. Please try again later.');
            res.redirect('/register');
        }
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
