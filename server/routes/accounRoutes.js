const express = require('express');
const pool = require('../db');
const router = express.Router();

// Check account balance
router.get('/balance', async (req, res) => {
  const { userId } = req.query;

  try {
    const account = await pool.query('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
    if (account.rows.length === 0) {
      return res.status(400).json({ message: 'Account not found' });
    }

    res.json({ balance: account.rows[0].balance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance' });
  }
});

// Deposit money
router.post('/deposit', async (req, res) => {
  const { userId, amount } = req.body;

  try {
    await pool.query('UPDATE accounts SET balance = balance + $1 WHERE user_id = $2', [amount, userId]);
    res.json({ message: 'Deposit successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error depositing money' });
  }
});

// Withdraw money
router.post('/withdraw', async (req, res) => {
  const { userId, amount } = req.body;

  try {
    const account = await pool.query('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
    if (account.rows.length === 0) {
      return res.status(400).json({ message: 'Account not found' });
    }

    if (account.rows[0].balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    await pool.query('UPDATE accounts SET balance = balance - $1 WHERE user_id = $2', [amount, userId]);
    res.json({ message: 'Withdrawal successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error withdrawing money' });
  }
});

// Transfer money
router.post('/transfer', async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  try {
    const fromAccount = await pool.query('SELECT balance FROM accounts WHERE user_id = $1', [fromUserId]);
    if (fromAccount.rows.length === 0) {
      return res.status(400).json({ message: 'Sender account not found' });
    }

    if (fromAccount.rows[0].balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const toAccount = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [toUserId]);
    if (toAccount.rows.length === 0) {
      return res.status(400).json({ message: 'Receiver account not found' });
    }

    await pool.query('UPDATE accounts SET balance = balance - $1 WHERE user_id = $2', [amount, fromUserId]);
    await pool.query('UPDATE accounts SET balance = balance + $1 WHERE user_id = $2', [amount, toUserId]);

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error transferring money' });
  }
});

// Close account
router.post('/close-account', async (req, res) => {
  const { userId } = req.body;

  try {
    await pool.query('DELETE FROM accounts WHERE user_id = $1', [userId]);
    res.json({ message: 'Account closed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error closing account' });
  }
});

module.exports = router;
