// --- Global Variables ---
let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let currentPlaylistIndex = -1;
let playbackQueue = [];
let currentTrackIndex = 0;
let ytPlayer = null; // משתנה גלובלי לנגן ה-API

// --- YouTube IFrame API Setup ---
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
}
window.addEventListener('pageshow', (event) => {
    // אם הדף נטען מהמטמון (למשל בלחיצה על "אחורה")
    if (event.persisted) {
        window.location.reload();
    }
});
// --- 1. מאזין עצירה גלובלי (תמיד פעיל) ---
// הפתרון המוחץ: מחיקת ה-HTML של הנגנים בסגירה כדי להבטיח שקט מוחלט
document.addEventListener('hidden.bs.modal', function (event) {
    if (event.target.id === 'playerModal') {
        console.log("Stopping all media by DOM removal...");

        // 1. עצירת MP3
        const audioEl = document.getElementById('localAudioPlayer');
        if (audioEl) {
            audioEl.pause();
            audioEl.src = "";
            audioEl.load();
        }

        // 2. עצירת יוטיוב ע"י השמדת ה-Container הפנימי
        const ytContainer = document.getElementById('youtube-player-container');
        if (ytContainer) {
            ytContainer.innerHTML = "";
        }

        // 3. איפוס משתנה הנגן
        ytPlayer = null;
    }
}, true);

// --- 2. אתחול הדף ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    await fetchPlaylistsFromServer();
    displayUserInfo();

    const params = new URLSearchParams(window.location.search);
    const playlistId = params.get('id');

    if (playlistId !== null && currentUser.playlists && currentUser.playlists[playlistId]) {
        loadPlaylist(parseInt(playlistId));
    } else if (currentUser.playlists && currentUser.playlists.length > 0) {
        loadPlaylist(0);
    } else {
        renderSidebar();
    }
});

async function fetchPlaylistsFromServer() {
    try {
        const response = await fetch(`/api/get-playlists/${currentUser.username}`);
        if (response.ok) {
            currentUser.playlists = await response.json();
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.error("Sync failed", e);
    }
}

// --- Sidebar & Playlist Management ---

function renderSidebar() {
    const list = document.getElementById('playlistSidebarList');
    if (!list) return;
    list.innerHTML = '';
    currentUser.playlists.forEach((pl, index) => {
        const active = index === currentPlaylistIndex ? 'active' : '';
        list.innerHTML += `
            <div class="list-group-item list-group-item-action ${active} d-flex justify-content-between align-items-center">
                <span onclick="loadPlaylist(${index})" class="flex-grow-1" style="cursor:pointer">${pl.name}</span>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" title="Play All" onclick="playFullPlaylist(${index}, false)"><i class="bi bi-play"></i></button>
                    <button class="btn btn-sm btn-info" title="Shuffle" onclick="playFullPlaylist(${index}, true)"><i class="bi bi-shuffle"></i></button>
                </div>
            </div>`;
    });
}

function loadPlaylist(index) {
    currentPlaylistIndex = index;
    const playlist = currentUser.playlists[index];
    if (!playlist) return;

    // הצגת אזור ההעלאה - מוודא שהאלמנט הופך לגלוי ברגע שנבחר פלייליסט
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.remove('d-none');
    }

    document.getElementById('currentPlaylistName').innerText = playlist.name;
    document.getElementById('playlistActions').classList.remove('d-none');

    renderSongs(playlist.songs || []);
    renderSidebar(); // זה מעדכן את הרשימה

    // סגירה ידנית של התפריט במובייל
    closeSidebarOnMobile();
}

function closeSidebarOnMobile() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const toggler = document.querySelector('.navbar-toggler');

    // בודק אם אנחנו במובייל (הכפתור גלוי) ואם התפריט כרגע מוצג
    if (window.innerWidth < 768 && sidebarMenu.classList.contains('show')) {
        if (toggler) {
            toggler.click(); // "לחיצה" וירטואלית שסוגרת את התפריט דרך Bootstrap
        }
    }
}

function renderSongs(songs) {
    const tableBody = document.getElementById('songsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (songs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No songs found.</td></tr>';
        return;
    }

    songs.forEach((song, idx) => {
        // הכנת כותרת בטוחה ל-onclick
        const safeTitle = song.title.replace(/'/g, "\\'");

        tableBody.innerHTML += `
        <tr>
            <td>${idx + 1}</td>
            <td class="video-title text-truncate" title="${song.title}">${song.title}</td>
            <td class="text-center">
                <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateRating(${idx}, this.value)">
                    ${[0, 1, 2, 3, 4, 5].map(r => `<option value="${r}" ${song.rating == r ? 'selected' : ''}>${r} ⭐</option>`).join('')}
                </select>
            </td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm" onclick="deleteSong(${idx})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
            <td class="text-center">
                <button class="btn btn-success btn-sm" onclick="playSingleTrack('${song.videoId}', '${safeTitle}', ${song.isLocal || false})">
                    <i class="bi bi-play-fill"></i>
                </button>
            </td>
        </tr>`;
    });
}

// --- Advanced Playback Logic ---

function playSingleTrack(id, title, isLocal) {
    playbackQueue = [{ videoId: id, title: title, isLocal: isLocal }];
    currentTrackIndex = 0;
    startPlayback();
}

function playFullPlaylist(index, shuffle = false) {
    const playlist = currentUser.playlists[index];
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
        alert("Playlist is empty!");
        return;
    }

    playbackQueue = [...playlist.songs];
    if (shuffle) {
        playbackQueue.sort(() => Math.random() - 0.5);
    }

    currentTrackIndex = 0;
    startPlayback();
}

function startPlayback() {
    const track = playbackQueue[currentTrackIndex];
    if (!track) return;

    const ytContainer = document.getElementById('youtube-player-container');
    const localContainer = document.getElementById('local-player-container');
    const audioEl = document.getElementById('localAudioPlayer');
    const localTitle = document.getElementById('localTrackTitle');

    // פתיחת המודאל
    const modalElem = document.getElementById('playerModal');
    let modal = bootstrap.Modal.getInstance(modalElem);
    if (!modal) modal = new bootstrap.Modal(modalElem);
    modal.show();

    // בדיקה: האם זה שיר מקומי או יוטיוב?
    const isMp3 = track.isLocal === true || (track.videoId && track.videoId.includes('/uploads/'));

    if (isMp3) {
        // --- מצב MP3 ---
        ytContainer.classList.add('d-none');
        ytContainer.innerHTML = ""; // ניקוי יוטיוב מה-DOM

        localContainer.classList.remove('d-none');
        localTitle.innerText = track.title;

        audioEl.src = track.videoId;
        audioEl.load();
        audioEl.play().catch(e => console.log("Playback failed (User interaction needed)"));

        audioEl.onended = () => nextTrack();
    } else {
        // --- מצב יוטיוב ---
        localContainer.classList.add('d-none');
        audioEl.pause();
        ytContainer.classList.remove('d-none');

        // יצירת אלמנט נקי ליוטיוב
        ytContainer.innerHTML = '<div id="yt-placeholder"></div>';

        ytPlayer = new YT.Player('yt-placeholder', {
            height: '100%',
            width: '100%',
            videoId: track.videoId,
            playerVars: { 'autoplay': 1, 'controls': 1 },
            events: {
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) nextTrack();
                }
            }
        });
    }
    updateUIStrings(track);
}

function nextTrack() {
    if (currentTrackIndex < playbackQueue.length - 1) {
        currentTrackIndex++;
        startPlayback(); // קריאה ל-startPlayback שמנהלת את סוגי הנגנים
    }
}

function prevTrack() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        startPlayback();
    }
}

function updateUIStrings(track) {
    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('queueStatus').innerText = `${currentTrackIndex + 1} / ${playbackQueue.length}`;
}

// --- Search, Sort & Sync ---

function filterSongs() {
    const term = document.getElementById('innerSearch').value.toLowerCase();
    const songs = currentUser.playlists[currentPlaylistIndex].songs || [];
    const filtered = songs.filter(s => s.title.toLowerCase().includes(term));
    renderSongs(filtered);
}

function sortSongs() {
    const sortBy = document.getElementById('sortSelect').value;
    let songs = [...(currentUser.playlists[currentPlaylistIndex].songs || [])];
    if (sortBy === 'name') songs.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'rating') songs.sort((a, b) => b.rating - a.rating);
    renderSongs(songs);
}

async function syncWithServer() {
    try {
        await fetch('/api/update-playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser.username,
                playlists: currentUser.playlists
            })
        });
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (e) {
        console.error("Sync failed", e);
    }
}

function updateRating(idx, val) {
    currentUser.playlists[currentPlaylistIndex].songs[idx].rating = parseInt(val);
    syncWithServer();
}

async function deleteSong(idx) {
    if (confirm("Delete this song?")) {
        currentUser.playlists[currentPlaylistIndex].songs.splice(idx, 1);
        await syncWithServer();
        renderSongs(currentUser.playlists[currentPlaylistIndex].songs);
    }
}

async function deleteCurrentPlaylist() {
    if (confirm("Delete the entire playlist?")) {
        currentUser.playlists.splice(currentPlaylistIndex, 1);
        await syncWithServer();
        window.location.reload();
    }
}

async function createNewPlaylist() {
    const nameInput = document.getElementById('newPlaylistNameInput');
    const name = nameInput ? nameInput.value.trim() : "";
    if (!name) return;
    currentUser.playlists.push({ name: name, songs: [] });
    await syncWithServer();
    window.location.reload();
}

function displayUserInfo() {
    const container = document.getElementById('userInfo');
    if (container && currentUser) {
        container.innerHTML = `
            <span class="text-white me-3">Welcome, ${currentUser.firstName}</span>
            <img src="${currentUser.photoUrl}" class="rounded-circle" width="40" height="40" style="object-fit:cover">
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="logout()">Logout</button>
        `;
    }
}

async function uploadMP3() {
    const fileInput = document.getElementById('mp3FileInput');
    const status = document.getElementById('uploadStatus');
    const file = fileInput.files[0];

    if (currentPlaylistIndex === -1) {
        alert("Please select a playlist first!");
        return;
    }
    if (!file) {
        alert("Select an MP3 file.");
        return;
    }

    const formData = new FormData();
    formData.append('mp3', file);
    formData.append('username', currentUser.username);
    formData.append('playlistIndex', currentPlaylistIndex.toString());

    status.innerText = "Uploading...";
    try {
        const response = await fetch('/api/upload-mp3', { method: 'POST', body: formData });
        if (response.ok) {
            const result = await response.json();
            const newSong = {
                title: file.name.replace('.mp3', ''),
                videoId: result.filePath,
                isLocal: true,
                rating: 0
            };
            currentUser.playlists[currentPlaylistIndex].songs.push(newSong);
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            renderSongs(currentUser.playlists[currentPlaylistIndex].songs);
            status.innerText = "Success!";
            fileInput.value = '';
        }
    } catch (e) { status.innerText = "Upload failed."; }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.replace('index.html');
}