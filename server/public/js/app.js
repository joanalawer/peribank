document.addEventListener('DOMContentLoaded', () => {
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const email = document.getElementById('email').value;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }

  // Function to get query parameters from the URL
  function getQueryParams() {
      const params = new URLSearchParams(window.location.search);
      let errors = [];
      for (const [key, value] of params.entries()) {
          if (key === 'message') {
              errors.push(value);
          }
      }
      return errors;
  }
  // Display errors if any
  const errors = getQueryParams();
  if (errors.length > 0) {
      const errorContainer = document.getElementById('error-messages');
      errors.forEach(message => {
          const errorElement = document.createElement('p');
          errorElement.className = 'error';
          errorElement.textContent = message;
          errorContainer.appendChild(errorElement);
      });
  }

  
  

  

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }

  // Balance form
  const balanceForm = document.getElementById('balanceForm');
  if (balanceForm) {
    balanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('userId').value;

      const response = await fetch(`/api/balance?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      document.getElementById('balance').innerText = `Balance: $${data.balance}`;
    });
  }

  // Deposit form
  const depositForm = document.getElementById('depositForm');
  if (depositForm) {
    depositForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('userId').value;
      const amount = document.getElementById('amount').value;

      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }

  // Withdraw form
  const withdrawForm = document.getElementById('withdrawForm');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('userId').value;
      const amount = document.getElementById('amount').value;

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }

  // Transfer form
  const transferForm = document.getElementById('transferForm');
  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fromUserId = document.getElementById('fromUserId').value;
      const toUserId = document.getElementById('toUserId').value;
      const amount = document.getElementById('amount').value;

      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromUserId, toUserId, amount }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }

  // Close account form
  const closeAccountForm = document.getElementById('closeAccountForm');
  if (closeAccountForm) {
    closeAccountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('userId').value;

      const response = await fetch('/api/close-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      document.getElementById('message').innerText = data.message;
    });
  }
});