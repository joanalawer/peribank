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

// Helper function to verify user credentials
const verifyUserCredentials = async (user_id, password) => {
    try {
        // Fetch user
        const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);

        if (userResult.rows.length === 0) {
            return { success: false, message: 'Invalid User ID or Password' };
        }

        const user = userResult.rows[0];

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return { success: false, message: 'Invalid User ID or Password' };
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

// Helper function to get user balance
const getUserBalance = async (user_id) => {
    try {
        const result = await pool.query('SELECT balance FROM balances WHERE user_id = $1', [user_id]);
        
        if (result.rows.length === 0) {
            return { success: false, message: 'Balance record not found' };
        }
        
        return { success: true, balance: result.rows[0].balance };
    } catch (error) {
        console.error('Error fetching balance:', error);
        return { success: false, message: 'Error fetching balance' };
    }
};

// Helper function to check sufficient balance
const checkSufficientBalance = async (user_id, amount) => {
    const balanceResult = await getUserBalance(user_id);
    
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
    
    return { success: true, balance: balanceResult.balance };
};

module.exports = {
    requireLogin,
    verifyUserCredentials,
    validateAmount,
    getUserBalance,
    checkSufficientBalance
};