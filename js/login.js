// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById('loginUsername').value;
    const passwordInput = document.getElementById('loginPassword').value;
    const errorDisplay = document.getElementById('loginError');

    // 1. Get the list of users from LocalStorage [cite: 18, 27]
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // 2. Find a user that matches both username and password 
    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        // 3. Success: Store the current user in SessionStorage 
        // We store the full object (excluding sensitive data if needed, but here we need it for UI)
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // 4. Redirect to the search page [cite: 28, 29, 33]
        window.location.href = 'search.html';
    } else {
        // 5. Failure: Display error message
        errorDisplay.innerText = "Invalid username or password. Please try again.";
    }
});