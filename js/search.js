// 1. IMPORTANT: Replace this string with your actual API Key from Google Console
const API_KEY = 'AIzaSyCxB6GGtI4TUHz06tASNy9h0ulyS1mNv1o';


let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let selectedVideo = null;
let currentVideos = []; // Store results to handle re-rendering [cite: 42]

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in [cite: 28]
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Display Welcome message and Photo [cite: 30, 34]
    displayUserInfo();

    // Support for QueryString on page load (Sync search with URL) [cite: 40]
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
        document.getElementById('searchInput').value = q;
        performSearch(q);
    }

    // Search button click event [cite: 36]
    document.getElementById('searchBtn').addEventListener('click', () => {
        initiateSearch();
    });

    // Support for "Enter" key in search input
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') initiateSearch();
    });
});

function displayUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `
            <span class="text-white me-2">Welcome, ${currentUser.firstName}</span> 
            <img src="${currentUser.photoUrl}" class="rounded-circle shadow-sm" width="40" height="40" style="object-fit:cover"> 
            <button class="btn btn-sm btn-outline-danger ms-2" onclick="logout()">Logout</button>
        `;
    }
}

function initiateSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        // Sync the search with QueryString parameters [cite: 40, 41]
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        performSearch(query);
    }
}

async function performSearch(query) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '<div class="text-center w-100 mt-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            currentVideos = data.items;
            renderResults(data.items);
        } else {
            resultsContainer.innerHTML = '<p class="text-center mt-5">No results found.</p>';
        }
    } catch (error) {
        console.error("Search failed:", error);
        resultsContainer.innerHTML = '<p class="text-danger text-center mt-5">Error fetching data from YouTube API.</p>';
    }
}

function renderResults(videos) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    // Check which videos are already in user's playlists [cite: 61]
    const savedIds = currentUser.playlists.flatMap(pl => pl.songs.map(s => s.videoId));

    videos.forEach(video => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumb = video.snippet.thumbnails.high.url;
        const isSaved = savedIds.includes(videoId);

        // Card structure with Bootstrap [cite: 44]
        container.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm video-card border-0">
                    <div class="position-relative">
                        <img src="${thumb}" class="card-img-top cursor-pointer" onclick="openPlayer('${videoId}', '${title.replace(/'/g, "\\'")}')"> 
                        <div class="position-absolute bottom-0 end-0 m-2 badge bg-dark opacity-75">Play Now</div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title text-truncate-2 mb-3" title="${title}">
                            ${isSaved ? '<i class="bi bi-check-circle-fill text-success"></i> ' : ''} 
                            ${title}
                        </h6>
                        <button class="btn ${isSaved ? 'btn-secondary disabled' : 'btn-outline-primary'} btn-sm mt-auto" 
                                onclick="openAddModal('${videoId}', '${title.replace(/'/g, "\\'")}')">
                            ${isSaved ? 'Saved in Library' : '<i class="bi bi-plus-lg"></i> Add to Favorites'} 
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

// Open video in Bootstrap Modal [cite: 53]
function openPlayer(id, title) {
    const playerIframe = document.getElementById('videoPlayer');
    const currentOrigin = window.location.origin;

    // Fix for YouTube Embed reliability
    playerIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&origin=${currentOrigin}`;
    document.getElementById('videoTitleDisplay').innerText = title;

    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    videoModal.show();

    // Stop video when modal closes
    document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
        playerIframe.src = '';
    });
}

// Modal for adding to playlist [cite: 56, 57, 58]
function openAddModal(id, title) {
    selectedVideo = { videoId: id, title: title, rating: 0 };
    const select = document.getElementById('playlistSelect');

    // Populate existing playlists dropdown [cite: 57]
    select.innerHTML = '<option value="">-- Select Playlist --</option>';
    currentUser.playlists.forEach((pl, index) => {
        select.innerHTML += `<option value="${index}">${pl.name}</option>`;
    });

    const playlistModal = new bootstrap.Modal(document.getElementById('playlistModal'));
    playlistModal.show();
}

// Confirm Save Logic [cite: 60, 62]
function confirmSave() {
    const playlistIndex = document.getElementById('playlistSelect').value;
    const newName = document.getElementById('newPlaylistName').value.trim();

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIdx = users.findIndex(u => u.username === currentUser.username);

    if (newName) {
        // Option 2: Create new playlist [cite: 58, 60]
        users[userIdx].playlists.push({ name: newName, songs: [selectedVideo] });
    } else if (playlistIndex !== "") {
        // Option 1: Add to existing playlist [cite: 57, 60]
        users[userIdx].playlists[playlistIndex].songs.push(selectedVideo);
    } else {
        alert("Please select or create a playlist");
        return;
    }

    // Save data and update session [cite: 28, 60]
    localStorage.setItem('users', JSON.stringify(users));
    sessionStorage.setItem('currentUser', JSON.stringify(users[userIdx]));
    currentUser = users[userIdx];

    // Hide Modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
    modalInstance.hide();
    document.getElementById('newPlaylistName').value = '';

    // Show Notification Toast with Quick Link [cite: 62]
    showToastNotification();

    // Refresh current results to show Checkmark [cite: 61]
    renderResults(currentVideos);
}

function showToastNotification() {
    const toastHTML = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1060">
            <div class="toast show align-items-center text-white bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        Success! Song added to your library. 
                        <a href="playlists.html" class="text-white fw-bold ms-2 border-bottom">Go to Playlists</a> 
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', toastHTML);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

