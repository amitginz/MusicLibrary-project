// --- Global Variables ---
// Get data from session and local storage 
let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let users = JSON.parse(localStorage.getItem('users'));
let currentPlaylistIndex = -1;

// Playback Queue State
let playbackQueue = [];
let currentTrackIndex = 0;
let isShuffle = false;

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Safety check: Redirect if session is missing [cite: 28]
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    displayUserInfo(); // Display name and photo in header [cite: 30, 34]

    // Handle QueryString parameters [cite: 76]
    const params = new URLSearchParams(window.location.search);
    const playlistId = params.get('id');

    renderSidebar(); // Load the list of playlists [cite: 69]

    // Load requested playlist or default to the first one [cite: 76, 77]
    if (playlistId !== null && currentUser.playlists && currentUser.playlists[playlistId]) {
        loadPlaylist(parseInt(playlistId));
    } else if (currentUser.playlists && currentUser.playlists.length > 0) {
        loadPlaylist(0);
    }
});

/**
 * Update Navbar with current user's name and image [cite: 30, 34]
 */
function displayUserInfo() {
    const userInfoDiv = document.getElementById('userInfoHeader');
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `
            <span class="me-2">Welcome, ${currentUser.firstName}</span>
            <img src="${currentUser.photoUrl}" class="rounded-circle shadow-sm" width="35" height="35" style="object-fit:cover">
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="logout()">Logout</button>
        `;
    }
}

/**
 * Render the sidebar with Playlist names and Play/Shuffle buttons [cite: 66-70]
 */
function renderSidebar() {
    const listContainer = document.getElementById('playlistSidebarList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!currentUser.playlists) return;

    currentUser.playlists.forEach((pl, index) => {
        const activeClass = (index == currentPlaylistIndex) ? 'active' : '';
        listContainer.innerHTML += `
            <div class="list-group-item list-group-item-action ${activeClass} d-flex flex-column p-2 mb-2 shadow-sm rounded">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span onclick="loadPlaylist(${index})" style="cursor:pointer; font-weight: 600; flex-grow: 1;">
                        <i class="bi bi-music-note-list me-2 text-primary"></i> ${pl.name}
                    </span>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-success flex-grow-1" onclick="playFullPlaylist(${index}, false)">
                        <i class="bi bi-play-fill"></i> Play
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="playFullPlaylist(${index}, true)" title="Shuffle Mode">
                        <i class="bi bi-shuffle"></i>
                    </button>
                </div>
            </div>`;
    });
}

/**
 * Load a specific playlist and display its songs [cite: 71, 72]
 */
function loadPlaylist(index) {
    currentPlaylistIndex = index;
    const playlist = currentUser.playlists[index];

    const titleElem = document.getElementById('currentPlaylistName');
    if (titleElem) titleElem.innerText = playlist.name;

    const actionsElem = document.getElementById('playlistActions');
    if (actionsElem) actionsElem.classList.remove('d-none');

    renderSongs(playlist.songs);
    renderSidebar(); // Update active state visually
}

/**
 * Render songs into the table with fixed column alignment as per your screenshot
 * [cite: 71, 74, 79]
 */
function renderSongs(songs) {
    const tableBody = document.getElementById('songsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!songs || songs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No songs found in this playlist.</td></tr>';
        return;
    }

    songs.forEach((song, idx) => {
        tableBody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${song.title}</strong></td>
                <td>
                    <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateRating(${idx}, this.value)">
                        ${[0, 1, 2, 3, 4, 5].map(r => `<option value="${r}" ${song.rating == r ? 'selected' : ''}>${r} Stars</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSong(${idx})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="playSingleSong('${song.videoId}', '${song.title.replace(/'/g, "\\'")}')" title="Play Now">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// --- Playback Logic ---

function playFullPlaylist(index, shuffleMode = false) {
    const playlist = currentUser.playlists[index];
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
        alert("Playlist is empty.");
        return;
    }

    isShuffle = shuffleMode;
    playbackQueue = [...playlist.songs];

    if (isShuffle) {
        for (let i = playbackQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playbackQueue[i], playbackQueue[j]] = [playbackQueue[j], playbackQueue[i]];
        }
    }

    currentTrackIndex = 0;
    openPlaylistPlayer();
}

function playSingleSong(videoId, title) {
    playbackQueue = [{ videoId, title }];
    currentTrackIndex = 0;
    openPlaylistPlayer();
}

function openPlaylistPlayer() {
    const song = playbackQueue[currentTrackIndex];
    let playerModal = document.getElementById('playerModal');

    if (!playerModal) {
        const modalHTML = `
            <div class="modal fade" id="playerModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content bg-dark text-white border-0 shadow-lg">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title" id="playerTitle"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0">
                            <div class="ratio ratio-16x9">
                                <iframe id="playerIframe" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                            </div>
                        </div>
                        <div class="modal-footer border-secondary justify-content-between py-2">
                            <button class="btn btn-outline-light btn-sm" onclick="prevTrack()"><i class="bi bi-skip-start-fill"></i> Prev</button>
                            <span id="queueStatus" class="small"></span>
                            <button class="btn btn-outline-light btn-sm" onclick="nextTrack()">Next <i class="bi bi-skip-end-fill"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        playerModal = document.getElementById('playerModal');
    }

    updatePlayerSource();
    new bootstrap.Modal(playerModal).show();

    playerModal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('playerIframe').src = '';
    });
}

function updatePlayerSource() {
    const song = playbackQueue[currentTrackIndex];
    const iframe = document.getElementById('playerIframe');
    const origin = window.location.origin;

    document.getElementById('playerTitle').innerText = (isShuffle ? "🔀 " : "") + song.title;
    document.getElementById('queueStatus').innerText = `Track ${currentTrackIndex + 1} of ${playbackQueue.length}`;
    iframe.src = `https://www.youtube.com/embed/${song.videoId}?autoplay=1&origin=${origin}`;
}

function nextTrack() {
    if (currentTrackIndex < playbackQueue.length - 1) {
        currentTrackIndex++;
        updatePlayerSource();
    }
}

function prevTrack() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        updatePlayerSource();
    }
}

// --- Data Management Functions ---

function updateRating(songIdx, newRating) {
    currentUser.playlists[currentPlaylistIndex].songs[songIdx].rating = parseInt(newRating);
    saveData();
}

function filterSongs() {
    const term = document.getElementById('innerSearch').value.toLowerCase();
    const filtered = currentUser.playlists[currentPlaylistIndex].songs.filter(s =>
        s.title.toLowerCase().includes(term)
    );
    renderSongs(filtered);
}

function sortSongs() {
    const sortBy = document.getElementById('sortSelect').value;
    let songs = [...currentUser.playlists[currentPlaylistIndex].songs];

    if (sortBy === 'name') {
        songs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'rating') {
        songs.sort((a, b) => b.rating - a.rating);
    }
    renderSongs(songs);
}

function deleteSong(songIdx) {
    if (confirm("Remove this song?")) {
        currentUser.playlists[currentPlaylistIndex].songs.splice(songIdx, 1);
        saveData();
        loadPlaylist(currentPlaylistIndex);
    }
}

function deleteCurrentPlaylist() {
    if (confirm("Delete the entire playlist?")) {
        currentUser.playlists.splice(currentPlaylistIndex, 1);
        saveData();
        window.location.reload();
    }
}

function createNewPlaylist() {
    const nameInput = document.getElementById('newPlaylistNameInput');
    const name = nameInput.value.trim();
    if (!name) return;

    if (!currentUser.playlists) currentUser.playlists = [];
    currentUser.playlists.push({ name: name, songs: [] });
    saveData();
    nameInput.value = '';
    bootstrap.Modal.getInstance(document.getElementById('newPlaylistModal')).hide();
    renderSidebar();
}

/**
 * Persist changes to LocalStorage and SessionStorage 
 */
function saveData() {
    const usersList = JSON.parse(localStorage.getItem('users')) || [];
    const userIdx = usersList.findIndex(u => u.username === currentUser.username);
    if (userIdx !== -1) {
        usersList[userIdx].playlists = currentUser.playlists;
        localStorage.setItem('users', JSON.stringify(usersList));
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}