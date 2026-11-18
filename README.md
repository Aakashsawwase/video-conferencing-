# 🎥 Zoom Clone — Full-Stack Video Conferencing Platform

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7.3-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Real--Time-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)

A full-stack, feature-rich video conferencing web application inspired by **Zoom**. Built from the ground up using **React**, **Node.js**, **Express**, **Socket.io**, and **WebRTC**, featuring an authentic Zoom dark-mode UI, client-side meeting recording, floating emoji reactions, and real-time device selection.

---

## ✨ Features

### 🖥️ Authentic Zoom Design System
- **Desktop-Style Dashboard**: Iconic 4-action tile grid (*New Meeting*, *Join Meeting*, *Share Screen*, *Past Meetings*) with a live digital clock & date widget.
- **Pre-Meeting Lobby**: Preview camera and microphone before joining, toggle media states, and select audio/video input devices.
- **Zoom In-Meeting Dock**: Bottom toolbar with labeled buttons, iconic green *Share Screen* button, and red *End Meeting* button.
- **Security & Meeting Timer**: Live elapsed call timer and encrypted badge in the top bar.

### 📹 Real-Time Video & Audio
- **P2P WebRTC Streaming**: Peer-to-peer audio and video transmission for low-latency communication.
- **Remote Mute & Video Sync**: Real-time synchronization of mic and camera states across all connected peers.
- **Avatar Initials Fallback**: Automatically displays an elegant initials avatar circle when a participant turns off their camera.
- **Hardware Fallback**: Gracefully handles systems without webcams or microphones using synthetic black/silent streams to prevent crashes.

### 🚀 Collaboration & In-Call Tools
- **🎙️ Audio & Video Device Selector**: Live dropdown switcher to select any connected microphone or webcam on the fly using `sender.replaceTrack()`.
- **✋ Raise Hand & Notifications**: Toggle hand-raising with an on-screen badge and room-wide toast notifications.
- **🎉 Floating Emoji Reactions**: Real-time floating animated emojis (👏, 👍, ❤️, 😂, 😮, 🎉) drifting upward on all participants' screens.
- **🔴 1-Click Meeting Recording**: Client-side recording via the browser's `MediaRecorder` API with automatic `.webm` video download.
- **🖥️ Screen Sharing**: Share desktop windows, browser tabs, or full screens with high-framerate capture.
- **💬 Live Meeting Chat**: Slide-in chat drawer with participant timestamps, sender color-coding, and unread message badges.

### 🔐 Authentication & History
- **User Authentication**: Secure user registration and login with encrypted passwords (`bcrypt`).
- **Past Meetings History**: Comprehensive activity log allowing users to view previous calls, copy meeting IDs, and instantly rejoin.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Material-UI (MUI), CSS Modules, Emotion |
| **Backend** | Node.js, Express.js, Socket.io |
| **Real-Time Protocols** | WebRTC (RTCPeerConnection), WebSockets |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication & Security** | Bcrypt password hashing, Token-based session management, CORS |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [MongoDB](https://www.mongodb.com/) (running locally on port `27017` or a MongoDB Atlas URI)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (see `backend/.env.example`):
   ```env
   PORT=8000
   MONGO_URI=mongodb://127.0.0.1:27017/zoom
   ```

---

## 💻 Running the Application

### Option 1: One-Click Startup (Windows)
Double-click the **`start.bat`** file in the root directory. It will launch both the backend and frontend in separate command windows.

### Option 2: Single Terminal Command
From the root directory, run:
```bash
npm run dev
```

### Option 3: Separate Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```
*Backend runs on: `http://localhost:8000`*

#### Terminal 2 — Frontend:
```bash
cd frontend
npm start
```
*Frontend runs on: `http://localhost:3000`*

---

## 🧪 Testing the Video Call

1. Open `http://localhost:3000` in your browser.
2. Sign up or log in, then click **"New Meeting"** or enter a meeting code (e.g. `room-101`).
3. Open a **second tab or Incognito window** (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>) and navigate to the same URL: `http://localhost:3000/room-101`.
4. Test live video/audio, screen sharing, floating reactions, chat, and meeting recording between both participants!

---

## 📁 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── socketManager.js   # WebRTC signaling, reactions & status sync
│   │   │   └── user.controller.js # Auth & meeting history controllers
│   │   ├── models/                # User & Meeting Mongoose schemas
│   │   ├── routes/                # Express API routes
│   │   └── app.js                 # Express server & Socket.io setup
│   ├── .env                       # Backend environment configuration
│   └── package.json
│
├── frontend/
│   ├── public/                    # Static assets & icons
│   ├── src/
│   │   ├── contexts/              # AuthContext & state management
│   │   ├── pages/
│   │   │   ├── VideoMeet.jsx      # Zoom video room, lobby, & dock
│   │   │   ├── home.jsx           # Desktop-style dashboard with clock widget
│   │   │   ├── landing.jsx        # SaaS marketing landing page
│   │   │   ├── authentication.jsx # Sign In / Sign Up modal
│   │   │   └── history.jsx        # Past meetings history & rejoin
│   │   ├── styles/
│   │   │   └── videoComponent.module.css # Complete Zoom design system
│   │   ├── App.css                # Global & dashboard styles
│   │   └── environment.js         # API endpoint configuration
│   └── package.json
│
├── start.bat                      # Windows 1-click startup script
├── package.json                   # Root orchestrator scripts (concurrently)
└── README.md
```

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
