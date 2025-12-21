// הוסף את זה בתחילת פונקציית ה-submit
errorMsg.innerText = "";
// Handle registration form submission
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Getting form values
    const userId = document.getElementById('userId').value; // Added ID field
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstName').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const photoUrl = document.getElementById('photoUrl').value;
    const errorMsg = document.getElementById('errorMsg');

    // Password complexity: Min 6 chars, 1 letter, 1 number, 1 non-alphanumeric [cite: 21, 22]
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

    // 1. Mandatory fields check (including the new ID field) 
    if (!userId || !username || !firstName || !password || !photoUrl) {
        errorMsg.innerText = "All fields are required.";
        return;
    }

    // 2. Password complexity validation [cite: 21, 22]
    if (!passwordRegex.test(password)) {
        errorMsg.innerText = "Password must be at least 6 characters and contain a letter, a number, and a special character.";
        return;
    }

    // 3. Confirm password validation [cite: 23]
    if (password !== confirmPassword) {
        errorMsg.innerText = "Passwords do not match.";
        return;
    }

    // 4. Check if username already exists in LocalStorage [cite: 18]
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(u => u.username === username);

    if (userExists) {
        errorMsg.innerText = "Username already exists. Please choose another.";
        return;
    }

    // 5. Successful registration: Save user with ID and redirect to login 
    const newUser = {
        userId: userId, // Saved in the user object
        username: username,
        password: password,
        firstName: firstName,
        photoUrl: photoUrl,
        playlists: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert("Registration successful! Moving to Login.");
    window.location.href = 'login.html';
});