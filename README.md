# Apna Video Call (Zoom Clone)

A full-stack video conferencing web application built with Node.js, Express, Socket.io, WebRTC, React, and MongoDB.

---

## 🚀 Quick Start (Running on Your PC)

### Option 1: One-Click Startup (Recommended for Windows)
Simply double-click the **`start.bat`** script in this folder. It will automatically launch:
1. The **Backend Server** on `http://localhost:8000`
2. The **Frontend Client** on `http://localhost:3000`

### Option 2: Using NPM Scripts from the Root Folder
From this root directory:

```bash
# 1. Install all dependencies (already done!)
npm run install-all

# 2. Run both Backend and Frontend concurrently
npm run dev
```

### Option 3: Manual Startup in Separate Terminals

#### Terminal 1 (Backend):
```bash
cd backend
npm run dev
```
Backend runs at: **`http://localhost:8000`**

#### Terminal 2 (Frontend):
```bash
cd frontend
npm start
```
Frontend runs at: **`http://localhost:3000`**

---

## 🛠️ Configuration & Database

- **Backend Configuration**: Configured via `backend/.env`.
  - `PORT=8000`
  - `MONGO_URI=mongodb://127.0.0.1:27017/zoom` (uses your local MongoDB service)
- **Frontend Configuration**: Configured in `frontend/src/environment.js` to point to `http://localhost:8000` by default.

---

## ✨ Features Fixed & Verified

- **Route Typo Fixed**: Resolved compilation issue in `frontend/src/App.js`.
- **Offline / Local MongoDB Support**: Added `.env` support and automatic fallback so you do not need third-party Atlas clusters.
- **Local Asset Bundling**: Fixed missing/broken background image paths so all graphics display properly.
- **Hardware-Resilient WebRTC**: Gracefully handles systems without webcams or microphones with a black canvas and silent audio stream, preventing crashes.
- **Normalized Socket Rooms**: Allows seamless video and chat communication across multiple browser tabs and devices.
- **Full Verification**: End-to-end user registration, authentication, meeting activity logging, and live WebSocket messaging verified.
