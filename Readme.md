# 🎵 MusicTube - Music Management & Streaming Platform

MusicTube היא אפליקציית ווב מלאה (Full-Stack) המאפשרת למשתמשים לנהל פלייליסטים אישיים, לחפש שירים ב-YouTube, ולהעלות קבצי MP3 מקומיים לשרת. המערכת כוללת נגן מדיה חכם היודע להחליף בין סרטוני YouTube לקבצי אודיו מקומיים בצורה שקופה.

## 🚀 תכונות מרכזיות (Features)

* **ניהול משתמשים**: מערכת רישום והתחברות עם שמירת נתונים בשרת.
* **חיפוש YouTube**: אינטגרציה מלאה עם YouTube Data API v3 לחיפוש שירים בזמן אמת.
* **ניהול פלייליסטים**: יצירה, מחיקה וניהול פלייליסטים אישיים לכל משתמש.
* **העלאת MP3**: אפשרות להעלאת קבצי מוזיקה מהמחשב האישי ושמירתם בשרת (Node.js/Express).
* **נגן מדיה מתקדם**:
    * תמיכה בפורמט כפול (YouTube IFrame + HTML5 Audio).
    * מנגנון Autoplay למעבר אוטומטי לשיר הבא.
    * עצירה מוחלטת של המדיה בסגירת הנגן (DOM Removal).
* **UI/UX**: עיצוב רספונסיבי מלא (Mobile Friendly) המבוסס על Bootstrap 5.

## 🛠 טכנולוגיות (Tech Stack)

* **Front-end**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.
* **Back-end**: Node.js, Express.js.
* **Database**: קובץ JSON (users.json) לניהול נתונים קבוע בשרת.
* **APIs**: YouTube Data API v3.

## 📦 התקנה והרצה (Setup)

1. **שיבוט הפרויקט**:
   וודא שכל הקבצים נמצאים בתיקייה אחת (server.js, תיקיות ה-js, ה-css וה-html).

2. **תיקיית העלאות**:
   יש לוודא שקיימת תיקייה בשם `uploads` בתיקייה הראשית (במידה ולא קיימת, יש ליצור אותה ידנית).

3. **התקנת תלויות**:
   פתח טרמינל בתיקיית הפרויקט והרצ:
   ```bash
   npm install