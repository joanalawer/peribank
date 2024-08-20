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