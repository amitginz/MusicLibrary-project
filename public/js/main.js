// פונקציה שתרוץ בכל פעם שדף נטען
document.addEventListener("DOMContentLoaded", function () {
    checkUserLogin();
});

function checkUserLogin() {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    const authContainer = document.getElementById("user-info");

    if (currentUser) {
        // אם המשתמש מחובר, נציג את פרטיו ב-Header 
        authContainer.innerHTML = `
            <span class="me-2">שלום, ${currentUser.firstName}</span>
            <img src="${currentUser.photoUrl}" alt="User" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">
            <button class="btn btn-sm btn-link text-white ms-2" onclick="logout()">התנתק</button>
        `;
    }
}

function logout() {
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
}