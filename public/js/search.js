
let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let currentVideos = [];
let selectedVideo = null;
window.addEventListener('pageshow', (event) => {
    // אם הדף נטען מהמטמון (למשל בלחיצה על "אחורה")
    if (event.persisted) {
        window.location.reload();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    displayUserInfo();
    // 3. טעינת הפלייליסטים הקיימים לתוך ה-Select במודאל ההוספה
    loadPlaylistsToSelect();
    // 1. בדיקה האם יש חיפוש ב-URL (QueryString) - דרישה 2.3
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');

    if (queryParam) {
        document.getElementById('searchInput').value = queryParam;
        performSearch(queryParam);
    }
    // 2. שמירה על החיפוש האחרון פתוח (דרישה 2.5)
    else {
        const lastSearch = sessionStorage.getItem('lastSearchQuery');
        const lastResults = sessionStorage.getItem('lastSearchResults');

        if (lastSearch && lastResults) {
            document.getElementById('searchInput').value = lastSearch;
            currentVideos = JSON.parse(lastResults);
            renderResults(currentVideos);
        }
    }

    // מאזין לכפתור החיפוש
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', initiateSearch);
    }

    // מאזין למקש Enter בתיבת החיפוש
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') initiateSearch();
        });
    }

    // מאזין לסגירת מודאל הנגן - עוצר את המוזיקה 
    const videoModalElem = document.getElementById('videoModal');
    if (videoModalElem) {
        videoModalElem.addEventListener('hidden.bs.modal', () => {
            const iframe = document.getElementById('videoPlayer');
            if (iframe) iframe.src = '';
        });
    }
});

// פונקציה שמפעילה את תהליך החיפוש (מעדכנת URL וקוראת ל-API)
function initiateSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        // עדכון ה-QueryString בדפדפן (דרישה 41)
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        performSearch(query);
    }
}

// js/search.js
async function performSearch(query) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<div class="text-center w-100 mt-5"><div class="spinner-border text-primary"></div></div>';

    try {
        // קריאה אחת לשרת שלנו במקום שתיים ליוטיוב
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.items) {
            currentVideos = data.items.map(item => ({
                ...item,
                duration: formatDuration(item.duration), // עיבוד הזמן עדיין קורה בלקוח
                views: formatViews(item.viewCount)      // עיבוד הצפיות עדיין קורה בלקוח
            }));

            sessionStorage.setItem('lastSearchQuery', query);
            sessionStorage.setItem('lastSearchResults', JSON.stringify(currentVideos));
            renderResults(currentVideos);
        }
    } catch (error) {
        console.error("Search error:", error);
        resultsContainer.innerHTML = '<p class="text-center text-danger">Search failed. Please try again.</p>';
    }
}
// פונקציות עזר לעיצוב הנתונים 
function formatDuration(pt) {
    // הופך פורמט ISO 8601 (כמו PT4M20S) לפורמט קריא (4:20)
    const duration = pt.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '');
    return duration;
}
//מראה את כמות הצופים
function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
}

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function renderResults(videos) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    container.innerHTML = '';

    const allSavedVideoIds = (currentUser.playlists || []).flatMap(pl =>
        (pl.songs || []).map(s => s.videoId)
    );

    videos.forEach((video) => {
        const videoId = video.videoId || (video.id && video.id.videoId) || video.id;
        if (!videoId || typeof videoId !== 'string') return;

        // ניקוי הכותרת מהתגים המיוחדים (כמו &#39;)
        const cleanTitle = decodeHtml(video.snippet.title);
        const thumb = video.snippet.thumbnails.high.url;
        const isSavedSomewhere = allSavedVideoIds.includes(videoId);

        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4'; // הוספת מחלקות Bootstrap לעימוד
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${thumb}" class="card-img-top preview-trigger" style="cursor:pointer" alt="thumbnail">
                    <span class="badge bg-dark position-absolute bottom-0 end-0 m-2">${video.duration || ''}</span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title text-truncate-2" title="${cleanTitle}">
                        ${isSavedSomewhere ? '<span class="text-success">✔</span> ' : ''}${cleanTitle}
                    </h6>
                    <p class="text-muted small mb-2">${video.views || '0'} views</p>
                    <button class="btn btn-primary btn-sm mt-auto add-to-fav">
                        Add to Favorites
                    </button>
                </div>
            </div>`;

        // הוספת המאזינים - כאן הטקסט מועבר בבטחה בלי לשבור כלום!
        col.querySelector('.preview-trigger').addEventListener('click', () => openPlayer(videoId, cleanTitle));
        col.querySelector('.add-to-fav').addEventListener('click', () => openAddModal(videoId, cleanTitle));

        container.appendChild(col);
    });
}

// עדכון פונקציית הנגן שתהיה בטוחה יותר
function openPlayer(id, title) {
    console.log("Opening video:", id, title); // בדיקה ב-Console שהנתונים הגיעו נקיים

    const iframe = document.getElementById('videoPlayer');
    const titleDisp = document.getElementById('videoTitleDisplay');

    if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    }

    if (titleDisp) {
        titleDisp.innerText = title;
    }

    const modalElem = document.getElementById('videoModal');
    if (modalElem) {
        const modal = new bootstrap.Modal(modalElem);
        modal.show();
    }
}
// ... שאר הפונקציות (openAddModal, confirmSave, displayUserInfo) נשארות כפי שהיו ...
//logout from current user
function logout() {
    const iframe = document.getElementById('videoPlayer');
    if (iframe) iframe.src = '';

    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('lastSearchQuery');
    sessionStorage.removeItem('lastSearchResults');
    window.location.replace('index.html');
}

// עדכון פונקציית displayUserInfo שתתאים לעיצוב החדש
function displayUserInfo() {
    const container = document.getElementById('userInfo');
    if (container && currentUser) {
        container.innerHTML = `
            <span class="text-white me-3 small d-none d-sm-inline">Welcome, ${currentUser.firstName}</span>
            <img src="${currentUser.photoUrl}" class="rounded-circle border border-2 border-primary" width="35" height="35" style="object-fit:cover">
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="logout()">Logout</button>
        `;
    }
}

// עדכון פונקציית openAddModal - פשוטה ונקייה יותר
function openAddModal(id, title) {
    selectedVideo = {
        videoId: id,
        title: title,
        rating: 0
    };

    // טעינת הפלייליסטים מחדש בכל פעם שהמודאל נפתח (למקרה שנוספו מאז הטעינה)
    loadPlaylistsToSelect();

    const modalElem = document.getElementById('playlistModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

/**
 * אישור הוספת סרטון לפלייליסט (קיים או חדש) ושמירה בשרת
 * 
 */
async function confirmSave() {
    const playlistSelect = document.getElementById('playlistSelect');
    const newNameInput = document.getElementById('newPlaylistName');

    const playlistIndex = playlistSelect ? playlistSelect.value : "";
    const newName = newNameInput ? newNameInput.value.trim() : "";

    // וודא שנבחר סרטון (מתוך משתנה גלובלי selectedVideo) 
    if (!selectedVideo) {
        alert("No video selected.");
        return;
    }

    // יצירת עותק של הפלייליסטים הנוכחיים של המשתמש 
    let updatedPlaylists = Array.isArray(currentUser.playlists) ? [...currentUser.playlists] : [];

    // אופציה 2: יצירת פלייליסט חדש והוספת השיר אליו 
    if (newName) {
        updatedPlaylists.push({
            name: newName,
            songs: [selectedVideo]
        });
    }
    // אופציה 1: הוספה לפלייליסט קיים 
    else if (playlistIndex !== "") {
        const idx = parseInt(playlistIndex);

        // אתחול מערך שירים אם לא קיים
        if (!updatedPlaylists[idx].songs) updatedPlaylists[idx].songs = [];

        // בדיקה: האם השיר כבר קיים בפלייליסט הספציפי הזה?
        const isDuplicateInThisPlaylist = updatedPlaylists[idx].songs.some(s => s.videoId === selectedVideo.videoId);

        if (isDuplicateInThisPlaylist) {
            alert(`This song is already in the "${updatedPlaylists[idx].name}" playlist.`);
            return;
        }

        // הוספת השיר לפלייליסט שנבחר
        updatedPlaylists[idx].songs.push(selectedVideo);
    }
    else {
        alert("Please select a playlist or enter a new name.");
        return;
    }

    try {
        // שלב א': שליחת הנתונים המעודכנים לשרת (Node.js) 
        const response = await fetch('/api/update-playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser.username,
                playlists: updatedPlaylists
            })
        });

        if (response.ok) {
            // שלב ב': עדכון הזיכרון המקומי (Session) 
            currentUser.playlists = updatedPlaylists;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

            // שלב ג': סגירת המודאל וניקוי שדות 
            const modalElem = document.getElementById('playlistModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElem);
            if (modalInstance) modalInstance.hide();
            if (newNameInput) newNameInput.value = '';

            // שלב ד': הצגת הודעת הצלחה (Toast) עם קישור למעבר מהיר 
            showSuccessToast();

            // שלב ה': רינדור מחדש של תוצאות החיפוש לעדכון סימן ה-"V" 
            renderResults(currentVideos);
        } else {
            const errorData = await response.json();
            alert("Error saving: " + (errorData.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("Connection error to server.");
    }
}

// פונקציה ליצירת והצגת הודעת ה-Toast 
function showSuccessToast() {
    const toastContainer = document.getElementById('toastContainer') || document.body;

    const toastHTML = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
            <div class="toast show align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        Saved successfully! 
                        <a href="playlists.html" class="text-white fw-bold ms-2" style="text-decoration: underline;">
                            Go to Playlists →
                        </a>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>`;

    // הסרת טוסטים קודמים אם קיימים
    const oldToast = document.querySelector('.toast.show');
    if (oldToast) oldToast.parentElement.remove();

    document.body.insertAdjacentHTML('beforeend', toastHTML);

    // סגירה אוטומטית אחרי 5 שניות
    setTimeout(() => {
        const currentToast = document.querySelector('.toast.show');
        if (currentToast) currentToast.parentElement.remove();
    }, 5000);
}


// עדכון loadPlaylistsToSelect - מוסיף אופציית ברירת מחדל
function loadPlaylistsToSelect() {
    const select = document.getElementById('playlistSelect');
    if (!select) return;

    let options = '<option value="">-- Choose Existing Playlist --</option>';
    if (currentUser.playlists && currentUser.playlists.length > 0) {
        options += currentUser.playlists.map((pl, index) =>
            `<option value="${index}">${pl.name}</option>`
        ).join('');
    } else {
        options = '<option value="">No playlists found</option>';
    }
    select.innerHTML = options;
}

