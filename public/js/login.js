// Handle login form submission - Updated for Server-Side
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDisplay = document.getElementById('loginError');

    try {
        // שליחת בקשת התחברות לשרת במקום בדיקה מקומית
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // שמירת המשתמש שחזר מהשרת ב-SessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
            window.location.replace('search.html'); // מעבר לדף החיפוש
        } else {
            errorDisplay.innerText = result.message || "Invalid username or password.";
        }
    } catch (error) {
        console.error("Login error:", error);
        errorDisplay.innerText = "Server connection error.";
    }
});

