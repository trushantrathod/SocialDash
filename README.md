# SocialDash 🚀

## A Professional Real-Time YouTube Analytics Studio

SocialDash is a high-performance analytics dashboard built for YouTube
creators who want deeper insights into their growth.

It goes beyond simple subscriber counts by offering real-time velocity
metrics, milestone tracking, and goal-oriented analytics --- all while
being optimized for performance and thermal efficiency.

------------------------------------------------------------------------

## ✨ Key Features

### 🔴 Live Subscriber Tracking

High-frequency updates using a 60-second polling interval.

### 📈 Growth Velocity

Real-time calculation of subscriber gains during the current session.

### 🎯 Capped Goal Tracker

Dynamic progress bar that tracks your target milestone and caps at 100%
for logical accuracy.

### 🏆 Milestone Feed

Automatically logs and celebrates major subscriber thresholds during
live sessions.

### ❄️ Thermal Optimization

-   "Delta-Check" logic to prevent unnecessary MongoDB writes\
-   Page Visibility API to pause tracking when the tab is inactive\
-   Designed for efficient long-running sessions

### 📊 Professional Data Export

One-click CSV download of full subscriber history stored in MongoDB.

### 🕒 IST Localization

Fully synchronized to Indian Standard Time (UTC+5:30).

------------------------------------------------------------------------

## 🛠️ Tech Stack

  -----------------------------------------------------------------------
  Layer                      Technology
  -------------------------- --------------------------------------------
  Frontend                   React.js, Chart.js, Vite

  Backend                    FastAPI (Python 3.10+), Uvicorn

  Database                   MongoDB (Analytics History), Firebase
                             Firestore (User Profiles)

  Authentication             Firebase Authentication

  APIs                       YouTube Data API v3
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 🚀 Setup & Installation

### 1️⃣ Prerequisites

Make sure you have:

-   Node.js (v18+)
-   Python (v3.10+)
-   MongoDB running locally on port 27017
-   YouTube Data API Key (from Google Cloud Console)
-   Firebase Project for Authentication & Firestore

------------------------------------------------------------------------

### 2️⃣ Backend Installation

``` bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn google-api-python-client motor
```

Update your `backend/main.py` with your YouTube API Key:

``` python
YOUTUBE_API_KEY = "YOUR_KEY_HERE"
```

------------------------------------------------------------------------

### 3️⃣ Frontend Installation

``` bash
cd frontend
npm install
```

------------------------------------------------------------------------

## 🖥️ Running the Project

### ▶ Start Backend

``` bash
cd backend
python main.py
```

### ▶ Start Frontend

``` bash
cd frontend
npm run dev
```

------------------------------------------------------------------------

## 📌 Usage

1.  Open `http://localhost:5173`
2.  Register / Login
3.  Go to the Social Hub
4.  Enter your YouTube Channel ID (UC...)
5.  Start live tracking

------------------------------------------------------------------------

## 📜 License

Distributed under the MIT License.

------------------------------------------------------------------------

## 👨‍💻 Author

**Trushant Rathod**\
GitHub: https://github.com/trushantrathod

------------------------------------------------------------------------

⭐ If you find this project helpful, consider giving it a star!
