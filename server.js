const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3000;
require('dotenv').config();
const apiKey = process.env.YOUTUBE_API_KEY;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

// וודא שתיקיית העלאות קיימת (דרישה 87)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });



if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const readJsonFile = (filePath, defaultVal = {}) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
            return defaultVal;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return data.trim() ? JSON.parse(data) : defaultVal;
    } catch (error) {
        console.error("Error reading file:", filePath, error);
        return defaultVal;
    }
};

// --- API Endpoints ---
// server.js
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const key = process.env.YOUTUBE_API_KEY;

        // שלב א: חיפוש
        const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${key}`);
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
            return res.json({ items: [] });
        }

        // שלב ב: קבלת נתונים נוספים (זמן וצפיות) עבור כל ה-IDs
        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${key}`);
        const statsData = await statsRes.json();

        // איחוד הנתונים
        const combinedItems = searchData.items.map(item => {
            const details = statsData.items.find(v => v.id === item.id.videoId);
            return {
                ...item,
                duration: details ? details.contentDetails.duration : 'PT0S',
                viewCount: details ? details.statistics.viewCount : '0'
            };
        });

        res.json({ items: combinedItems });
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const allPlaylists = readJsonFile(PLAYLISTS_FILE, {});
        const userPlaylists = allPlaylists[username] || [];
        res.json({ success: true, user: { ...user, playlists: userPlaylists } });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.post('/api/register', (req, res) => {
    const { userId, username, password, firstName, photoUrl } = req.body;
    const users = readJsonFile(USERS_FILE, []);

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    // שמירת משתמש
    users.push({ userId, username, password, firstName, photoUrl });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    // יצירת פלייליסט ריק למשתמש החדש בקובץ הפלייליסטים
    const allPlaylists = readJsonFile(PLAYLISTS_FILE, {});
    allPlaylists[username] = [];
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(allPlaylists, null, 2));

    res.status(201).json({ message: "Registration successful" });
});

// תיקון פונקציית העדכון - היא חייבת לקרוא את המצב הקיים לפני שהיא דורסת
app.post('/api/update-playlists', (req, res) => {
    const { username, playlists } = req.body;
    if (!username || !Array.isArray(playlists)) return res.status(400).send("Invalid data");

    try {
        // קריאת כל הקובץ
        let allPlaylists = {};
        if (fs.existsSync(PLAYLISTS_FILE)) {
            const fileData = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
            allPlaylists = fileData ? JSON.parse(fileData) : {};
        }

        // עדכון רק של המשתמש הספציפי
        allPlaylists[username] = playlists;

        // כתיבה פיזית לכונן
        fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(allPlaylists, null, 2), 'utf8');

        console.log(`Successfully saved playlists for ${username}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Failed to save file:", error);
        res.status(500).send("Server Error");
    }
});


/**
 * נתיב להעלאת קובץ MP3 ועדכון הפלייליסט של המשתמש
 * דרישה: 87
 */
// הגדרת תיקייה סטטית לגישה לקבצים מהדפדפן
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload-mp3', upload.single('mp3'), (req, res) => {
    try {
        const { username, playlistIndex } = req.body;
        const pIdx = parseInt(playlistIndex);

        // נתיב לקובץ הפלייליסטים הנפרד
        const playlistsPath = path.join(__dirname, 'data', 'playlists.json');

        if (!fs.existsSync(playlistsPath)) {
            return res.status(500).json({ message: "Playlists file missing" });
        }

        let allPlaylists = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));

        // גישה לפלייליסטים של המשתמש הספציפי
        const userPlaylists = allPlaylists[username];

        if (!userPlaylists || !userPlaylists[pIdx]) {
            return res.status(400).json({ message: "Playlist not found in server file" });
        }

        const newSong = {
            title: req.file.originalname.replace('.mp3', ''),
            videoId: `/uploads/${req.file.filename}`,
            isLocal: true,
            rating: 0
        };

        // הוספת השיר למערך השירים בתוך הפלייליסט הנכון
        if (!userPlaylists[pIdx].songs) userPlaylists[pIdx].songs = [];
        userPlaylists[pIdx].songs.push(newSong);

        // שמירה חזרה לקובץ הפלייליסטים
        fs.writeFileSync(playlistsPath, JSON.stringify(allPlaylists, null, 2));

        res.json({ success: true, filePath: newSong.videoId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during upload" });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));