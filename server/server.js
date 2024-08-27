const express = require('express');
const path = require('path');
const app = express();
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();


// Set EJS as the templating engine for .html files
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// Set the views directory to /pages
app.set('views', path.join(__dirname, 'pages'));
// Serve static files from /public directory
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
    res.locals.successMessage = req.flash('successMessage');
    res.locals.errorMessage = req.flash('errorMessage');
    next();
});

const PORT = process.env.PORT || 3000;

// Define routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/services', (req, res) => {
    res.render('services');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        req.flash('errorMessage', 'Please login to access your account.');
        return res.redirect('/login');
    }

    const username = req.session.user.username;
    res.render('profile', {username: username, successMessage: req.flash('successMessage')});
});

app.get ('/balance', (req, res) => {
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
        req.flash('errorMessage', errors.map(err => err.message).join(', '));
        return res.redirect('/register');
    }
    else {
        try {
        // Check if email already exists
            const results = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

            if (results.rows.length > 0) {
                req.flash('errorMessage', 'Email already exists!');
                return res.redirect('/register');
            }

            // Generate a unique user ID
            let userID = uuidv4().slice(0, 5);

            // Hash password
            let hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user into the database
            await pool.query(
            'INSERT INTO users (user_id, username, email, password) VALUES ($1, $2, $3, $4)',
            [userID, username, email, hashedPassword]
         );
            
            req.flash('successMessage', 'Registration Successful! Please Login');
            res.redirect('/login');
        } catch (err) {
            console.error(err.message);
            req.flash('errorMessage', 'Server error. Please try again later.');
            res.redirect('/register');
        }
    }
});
  
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Query to fetch user data
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            req.flash('errorMessage', 'Invalid Username or Password');
            return res.redirect('/login');
        }

        const user = result.rows[0];

        // Compare the hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('errorMessage', 'Invalid Username or Password');
            return res.redirect('/login');
        }

        // If valid, store user data in the session
        req.session.user = {
            id:user.id,
            username: user.username,
            email: user.email
        };

        // redirect to the user profile
        req.flash('successMessage', 'Welcome to your dashboard!');
        res.redirect('/profile');
    
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Please try again later.');
    }
});

// Balance route
app.post('/balance', async (req, res) => {
    const { user_id, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);

        if (result.rows.length === 0) {
            req.flash('errorMessage', 'Invalid User ID or Password');
            return res.redirect('/balance');
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('errorMessage', 'Invalid User ID or Password');
            return res.redirect('/balance');
        }

        // Retrieve and display the balance here
        req.flash('successMessage', `Your balance is: $${user.balance}`);
        res.redirect('/balance');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Please try again later.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            req.flash('errorMessage', 'Failed to log out. Please try again.');
            return res.redirect('/profile');
        }
        res.redirect('/login');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
