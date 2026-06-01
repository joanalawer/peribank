const express = require('express');
const path = require('path');
const app = express();
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
// const pgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import middleware and helpers
const { 
    requireLogin, 
    verifyUserCredentials, 
    validateAmount, 
    getUserBalance,
    checkSufficientBalance,
    verifyAccountExists 
} = require('./middleware/auth');

// Set EJS as the templating engine for .html files
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// Set the views directory to /pages
app.set('views', path.join(__dirname, 'pages'));
// Serve static files from /public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));

// Set up the session
app.use(session({
    // store: new pgSession({ pool }),           // ← replaces MemoryStore
    secret: process.env.SESSION_SECRET || 'peribank_secret_2026',       // ← use env variable
    resave: false,
    saveUninitialized: false,
    // cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }     // 30 days
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
// =================================================================================================


// ============= REGISTER ROUTE ============
app.get('/register', (req, res) => {
    res.render('register');
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

            // Generate a unique 10-digit account number
            let accountNumber;
            let accountExists = true;
            
            while (accountExists) {
                // Generate random 10-digit number
                accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                
                // Check if account number already exists
                const accountCheck = await pool.query(
                    'SELECT * FROM users WHERE account_number = $1', 
                    [accountNumber]
                );
                
                if (accountCheck.rows.length === 0) {
                    accountExists = false;
                }
            }

            // Hash password
            let hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user into the database
            await pool.query(
                'INSERT INTO users (user_id, username, email, password, account_number) VALUES ($1, $2, $3, $4, $5)',
                [userID, username, email, hashedPassword, accountNumber]
            );

            // Initialize balance for new user
            await pool.query(
                'INSERT INTO balances (user_id, balance) VALUES ($1, $2)',
                [userID, 0.00]
            );
            
            req.flash('successMessage', `Registration Successful! Your account number is: ${accountNumber}. Please Login`);
            res.redirect('/login');
        } catch (err) {
            console.error(err.message);
            req.flash('errorMessage', 'Server error. Please try again later.');
            res.redirect('/register');
        }
    }
});
// ============= REGISTER ROUTE ENDS ============


// ============= LOGIN ROUTE ============
// ============= Login GET route ============
app.get('/login', (req, res) => {
    res.render('login');
});

// ============= Login POST route ============
app.post('/login', async (req, res) => {
    const { account_number, password } = req.body;

    // Query to fetch user data
    const query = 'SELECT * FROM users WHERE account_number = $1';
    const values = [account_number];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            req.flash('errorMessage', 'Invalid Account Number or Password');
            return res.redirect('/login');
        }

        const user = result.rows[0];

        // Compare the hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('errorMessage', 'Invalid Account Number or Password');
            return res.redirect('/login');
        }

        // If valid, store user data in the session
        req.session.user = {
            id:user.id,
            username: user.username,
            email: user.email,
            account_number: user.account_number
        };

        // redirect to the user profile
        req.flash('successMessage', 'Welcome to your dashboard!');
        res.redirect('/profile');
    
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Please try again later.');
    }
});
// ============= LOGIN ROUTE ENDS ============


// ============= PROFILE ROUTE ============
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        req.flash('errorMessage', 'Please login to access your account.');
        return res.redirect('/login');
    }

    const {username, account_number} = req.session.user;
    
    // Fetch account number from database
    pool.query('SELECT user_id, account_number FROM users WHERE account_number = $1', [account_number])
        .then(result => {
            const accountNumber = result.rows[0]?.account_number || 'N/A';
            const userId = result.rows[0]?.user_id || 'N/A';

            res.render('profile', {
                username,
                accountNumber,
                userId,
                successMessage: req.flash('successMessage')
            });
        })
        .catch(err => {
            console.error(err);
            res.render('profile', {
                username: username,
                accountNumber: 'N/A',
                userId: 'N/A',
                successMessage: req.flash('successMessage')
            });
        });
    });
// ============= PROFILE ROUTE ENDS ============


// ============= DEPOSIT ROUTE ============ //
// Deposit GET routes
app.get('/deposit', requireLogin, (req, res) => {
    res.render('deposit', {
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage')
    });
});

// Deposit POST route
app.post('/deposit', async (req, res) => {
    console.log('============ DEPOSIT ROUTE HIT ============');
    
    const { account_number, password, amount } = req.body;

    // Validate all fields
    if (!account_number || !password || !amount) {
        req.flash('errorMessage', 'Please fill in all fields');
        return res.redirect('/deposit');
    }

    try {
        // Verify credentials
        const credentialsCheck = await verifyUserCredentials(account_number, password);
        if (!credentialsCheck.success) {
            req.flash('errorMessage', credentialsCheck.message);
            return res.redirect('/deposit');
        }
        
        const user_id = credentialsCheck.user.user_id;
        
        // Validate amount
        const amountCheck = validateAmount(amount);
        if (!amountCheck.valid) {
            req.flash('errorMessage', amountCheck.message);
            return res.redirect('/deposit');
        }

        const depositAmount = amountCheck.amount;

        // Check if balance record exists
        const balanceCheck = await pool.query('SELECT * FROM balances WHERE user_id = $1', [user_id]);

        if (balanceCheck.rows.length === 0) {
            // Create new balance record
            await pool.query(
                'INSERT INTO balances (user_id, balance) VALUES ($1, $2)',
                [user_id, depositAmount]
            );
        } else {
            // Update existing balance
            await pool.query(
                'UPDATE balances SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [depositAmount, user_id]
            );
        }

        // Get updated balance
        const updatedBalance = await getUserBalance(account_number);
        const newBalance = updatedBalance.balance;

        req.flash('successMessage', `Deposit successful! New balance: GHS ${newBalance}`);
        res.redirect('/deposit');

    } catch (err) {
        console.error(err);
        req.flash('errorMessage', 'Server Error. Please try again later.');
        res.redirect('/deposit');
    }
});
// ============= DEPOSIT ROUTE ENDS ============


// ============= WITHDRAW ROUTE ============ //
// Withdraw GET routes
app.get('/withdraw', requireLogin, (req, res) => {
    res.render('withdraw', {
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage')
    });
});

// Withdraw POST route
app.post('/withdraw', async (req, res) => {
    console.log('============= WITHDRAW ROUTE HIT ============');

    const { amount, user_id, password } = req.body;

    // Validate all fields
    if (!user_id || !password || !amount) {
        req.flash('errorMessage', 'Please fill in all fields');
        return res.redirect('/withdraw');
    }

    try {
        // Verify credentials
        const credentialsCheck = await verifyUserCredentials(user_id, password);
        if (!credentialsCheck.success) {
            req.flash('errorMessage', credentialsCheck.message);
            return res.redirect('/withdraw');
        }
        // Validate amount
        const amountCheck = validateAmount(amount);
        if (!amountCheck.valid) {
            req.flash('errorMessage', amountCheck.message);
            return res.redirect('/withdraw');
        }

        const withdrawAmount = amountCheck.amount;

        // Check sufficient balance
        const balanceCheck = await checkSufficientBalance(user_id, withdrawAmount);
        if (!balanceCheck.success) {
            req.flash('errorMessage', balanceCheck.message);
            return res.redirect('/withdraw');
        }
        // Update balance
        await pool.query('UPDATE balances SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', 
            [withdrawAmount, user_id]
        );
        // Get updated balance
        const balanceResult = await getUserBalance(user_id);
        const newBalance = balanceResult.balance;

        console.log('Withdrawal successful. New balance:', newBalance);

        req.flash('successMessage', `Withdrawal successful! New balance: GHS ${newBalance}`);
        res.redirect('/withdraw');

    } catch (err) {
        console.error('Error in withdraw route', err);
        req.flash('errorMessage', 'Server Error. Please try again later.');
        res.redirect('/withdraw');
    }
});
// ============= WITHDRAW ROUTE ENDS ============ //


// ============= BALANCE ROUTE ENDS ============ //
// Balance route
app.get('/balance', requireLogin, (req, res) => {
    res.render('balance', {
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage')
    });
});

app.post('/balance', async (req, res) => {
    console.log('============= BALANCE ROUTE HIT ============');
    
    const { user_id, password, amount} = req.body;

    // Validate all fields
    if (!user_id || !password) {
        req.flash('errorMessage', 'Please fill in all fields');
        return res.redirect('/balance');
    }

    try {
        // Verify credentials
        const credentialsCheck = await verifyUserCredentials(user_id, password);
        if (!credentialsCheck.success) {
            req.flash('errorMessage', credentialsCheck.message);
            return res.redirect('/balance');
        }

        // Get balance
        const accountBalance = await getUserBalance(user_id);
      
        if (!accountBalance.success) {
            req.flash('errorMessage', accountBalance.message);
            return res.redirect('/balance');
        }

        const balance = accountBalance.balance;
        
        console.log('Account balance:', balance);

        // Render the balance page with the retrieved balance
        res.render('balance', { 
            balance: balance,  // ✅ Fixed: was using undefined 'balance'
            successMessage: req.flash('successMessage'),
            errorMessage: req.flash('errorMessage')
        });

    } catch (err) {
        console.error('Error in balance route:', err);
        req.flash('errorMessage', 'Server Error. Please try again later.');
        res.redirect('/balance');
    }
});
// ============= BALANCE ROUTE ENDS ============ //

// ============= TRANSFER ROUTE ============ //
// Teansfer GET route
app.get('/transfer', requireLogin, (req, res) => {
    res.render('transfer');
});

app.post('/transfer', async (req, res) => {
    console.log('============= TRANSFER ROUTE HIT ============');
    console.log('Request body:', req.body);

    const { sender_account, receiver_account, amount, password } = req.body;

    // Validate all fields
    if (!sender_account || !receiver_account || !amount || !password) {
        req.flash('errorMessage', 'Please fill in all fields');
        return res.redirect('/transfer');
    }

    // Prevent self-transfer
    if (sender_account === receiver_account) {
        req.flash('errorMessage', 'You cannot transfer to your own account');
        return res.redirect('/transfer');
    }
    try {
        // Verify sender credentials
        const credentialsCheck  = await verifyUserCredentials(sender_account, password);
        if (!credentialsCheck.success) {
            req.flash('errorMessage', credentialsCheck.message);
            return res.redirect('/transfer');
        }

        const sender = credentialsCheck.user;
        console.log('Sender verified:', sender.username);

        // Verify receiver account exist
        const receiverCheck = await verifyAccountExists(receiver_account);
        if (!receiverCheck.success) {
            req.flash('errorMessage', receiverCheck.message);
            return res.redirect('/transfer');
        }

        const receiver = receiverCheck.user;
        console.log('Receiver found:', receiver.username);

        // Validate amount
        const amountCheck = validateAmount(amount);
        if (!amountCheck.valid) {
            req.flash('errorMessage', amountCheck.message);
            return res.redirect('/transfer');
        }

        const transferAmount = amountCheck.amount;

        // Check if sender has sufficient balance
        const balanceCheck = await checkSufficientBalance(sender_account, transferAmount);
        if (!balanceCheck.success) {
            req.flash('errorMessage', balanceCheck.message);
            return res.redirect('/transfer');
        }

        // A transaction ensures BOTH updates succeed or BOTH fail
        // This prevents money being deducted from sender but not added to recipient
        await pool.query('BEGIN');

        try {
            // Deduct from sender account
            await pool.query('UPDATE balances SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [transferAmount, sender.user_id]
            );

            // Add to receiver account
            await pool.query('UPDATE balances SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [transferAmount, receiver.user_id]
            );

            // Commit the transaction if both succeed
            await pool.query('COMMIT');
            console.log('Transaction committed successfully');

        } catch (transactionErr){
            // Rollback tansaction if anything fails
            await pool.query('ROLLBACK');
            console.error('Transaction failed, rolled back:', transactionErr);
            req.flash('errorMessage', 'Transfer failed. Please try again.');
            return res.redirect('/transfer');
        }

        // Get sender's updated balance
        const updatedBalance = await getUserBalance(sender_account);
        const newBalance = updatedBalance.balance;

        console.log('Transfer successful. Sender new balance:', newBalance);

        req.flash('successMessage', 
            `Transfer successful! GHS ${transferAmount} sent to account ${receiver_account}. 
             Your new balance is: GHS ${newBalance}`
        );
        res.redirect('/transfer');

    } catch (err) {
        console.error('Error in transfer route:', err);
        req.flash('errorMessage', 'Server Error. Please try again later.');
        res.redirect('/transfer');
    }
});
// ============= TRANSFER ROUTE ENDS ============ //


// ============= CLOSE ACCOUNT ROUTE ============ //
// Close Account GET route
app.get('/close_account', requireLogin, (req, res) => {
    res.render('close_account');
});
// ============= CLOSE ACCOUNT ROUTE ENDS ============ //

// ============= LOGOUT ROUTE ============ //
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
// ============= LOGOUT ROUTE ENDS ============ //

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
