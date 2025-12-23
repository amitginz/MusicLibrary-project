/**
 * Registration logic - Updated for Part B (Server-Side)
 * Sends user data to the Node.js API instead of LocalStorage.
 */
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // 1. Collecting form values
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstName').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const photoUrl = document.getElementById('photoUrl').value;
    const errorMsg = document.getElementById('errorMsg');

    // Reset error message
    errorMsg.innerText = "";

    // 2. Validation: Password complexity
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

    if (!userId || !username || !firstName || !password || !photoUrl) {
        errorMsg.innerText = "All fields are required.";
        return;
    }

    if (!passwordRegex.test(password)) {
        errorMsg.innerText = "Password must be at least 6 characters, include a letter, a number, and a special character.";
        return;
    }

    if (password !== confirmPassword) {
        errorMsg.innerText = "Passwords do not match.";
        return;
    }

    // 3. Prepare user object
    const newUser = {
        userId,
        username,
        password,
        firstName,
        photoUrl,
        playlists: [] // Initialize with empty playlists
    };

    try {
        // 4. Send data to the Server API using FETCH
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        const result = await response.json();

        if (response.ok) {
            // Success: Redirect to login page
            alert("Registration successful! You can now log in.");
            window.location.href = 'login.html';
        } else {
            // Server-side error (e.g., username already exists)
            errorMsg.innerText = result.message || "Registration failed.";
        }
    } catch (error) {
        // Network or Server connection error
        console.error("Error during registration:", error);
        errorMsg.innerText = "Server connection error. Is the Node.js server running?";
    }
});