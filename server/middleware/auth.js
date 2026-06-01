// middleware/auth.js
const bcrypt = require('bcrypt');
const { pool } = require('../db');

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        req.flash('errorMessage', 'Please login to access this page.');
        return res.redirect('/login');
    }
    next();
};

// Helper function to verify user credentials (accountNumber OR user_id)
const verifyUserCredentials = async (identifier, password) => {
    try {
        // Fetch user
        const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1 OR account_number = $2', [identifier, identifier]);

        if (userResult.rows.length === 0) {
            return { success: false, message: 'Invalid User ID/Account Number or Password' };
        }

        const user = userResult.rows[0];

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return { success: false, message: 'Invalid User ID/Account Number or Password' };
        }

        return { success: true, user };
    } catch (error) {
        console.error('Error verifying credentials:', error);
        return { success: false, message: 'Server error during verification' };
    }
};

// Helper function to validate amount
const validateAmount = (amount) => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return { valid: false, message: 'Please enter a valid amount' };
    }
    
    return { valid: true, amount: parsedAmount };
};

// Helper function to get user balance (accepts account_number OR user_id)
const getUserBalance = async (identifier) => {
    try {
        // First get the user_id from account_number or user_id
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE account_number = $1 OR user_id = $2',
            [identifier, identifier]
        );

        if (userResult.rows.length === 0) {
            return { success: false, message: 'User not found' };
        }

        const user_id = userResult.rows[0].user_id;

        // Then get the balance using user_id
        const result = await pool.query(
            'SELECT balance FROM balances WHERE user_id = $1', 
            [user_id]
        );
        
        if (result.rows.length === 0) {
            return { success: false, message: 'Balance record not found' };
        }
        
        return { success: true, balance: result.rows[0].balance, user_id: user_id };
    } catch (error) {
        console.error('Error fetching balance:', error);
        return { success: false, message: 'Error fetching balance' };
    }
};

// Helper function to check sufficient balance
const checkSufficientBalance = async (identifier, amount) => {
    const balanceResult = await getUserBalance(identifier);
    
    if (!balanceResult.success) {
        return balanceResult;
    }
    
    if (balanceResult.balance < amount) {
        return { 
            success: false, 
            message: `Insufficient balance. Current balance: GHS ${balanceResult.balance}`,
            currentBalance: balanceResult.balance
        };
    }
    
    return { success: true, balance: balanceResult.balance, user_id: balanceResult.user_id };
};

// Helper function to verify receiver account exists
const verifyAccountExists = async (account_number) => {
    try {
        const result = await pool.query(
            'SELECT user_id, username, account_number FROM users WHERE account_number = $1',
            [account_number]
        );

        if (result.rows.length === 0) {
            return { success: false, message: 'Recipient account not found' };
        }

        return { success: true, user: result.rows[0] };
    } catch (error) {
        console.error('Error verifying account:', error);
        return { success: false, message: 'Error verifying recipient account' };
    }
};

module.exports = {
    requireLogin,
    verifyUserCredentials,
    validateAmount,
    getUserBalance,
    checkSufficientBalance,
    verifyAccountExists
};