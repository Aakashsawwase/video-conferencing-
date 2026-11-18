import React from 'react';
import "../App.css";
import { useNavigate } from 'react-router-dom';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function LandingPage() {
    const router = useNavigate();

    const handleJoinGuest = () => {
        // Generate a random guest room code
        const randomRoom = "guest-" + Math.floor(100000 + Math.random() * 900000);
        router(`/${randomRoom}`);
    };

    return (
        <div className="zoomLandingContainer">
            {/* STICKY NAVBAR */}
            <header className="zoomNav">
                <div className="zoomBrand" onClick={() => router("/")}>
                    <div className="zoomLogoBadge">
                        <VideocamIcon />
                    </div>
                    <span className="zoomBrandText">zoom<span>.us</span></span>
                </div>

                <div className="zoomNavLinks">
                    <span className="zoomNavLink" onClick={handleJoinGuest}>
                        Join as Guest
                    </span>
                    <span className="zoomNavLink" onClick={() => router("/auth")}>
                        Sign In
                    </span>
                    <button
                        type="button"
                        onClick={() => router("/auth")}
                        className="zoomNavBtnPrimary"
                    >
                        Sign Up Free
                    </button>
                </div>
            </header>

            {/* HERO SECTION */}
            <main className="zoomHero">
                <div className="zoomHeroBadge">
                    <span>✨ Next-Gen Web Video Conferencing</span>
                </div>

                <h1 className="zoomHeroTitle">
                    One platform to <span>connect</span>, collaborate, and celebrate.
                </h1>

                <p className="zoomHeroSubtitle">
                    Flawless video calls, crystal-clear audio, real-time messaging, and instant screen sharing. Built for teams, education, and friends.
                </p>

                <div className="zoomHeroActions">
                    <button
                        type="button"
                        onClick={() => router("/auth")}
                        className="zoomBtnLg zoomBtnPrimaryLg"
                    >
                        <span>Start for Free</span>
                        <ArrowForwardIcon fontSize="small" />
                    </button>

                    <button
                        type="button"
                        onClick={handleJoinGuest}
                        className="zoomBtnLg zoomBtnSecondaryLg"
                    >
                        <span>Join as Guest</span>
                    </button>
                </div>

                {/* FEATURE HIGHLIGHTS */}
                <div className="zoomFeaturesGrid">
                    <div className="zoomFeatureCard">
                        <div className="zoomFeatureIcon">
                            <VideocamIcon />
                        </div>
                        <h3>HD Video Meetings</h3>
                        <p>High-definition multi-party video conferencing with smart grid layouts.</p>
                    </div>

                    <div className="zoomFeatureCard">
                        <div className="zoomFeatureIcon" style={{ background: "rgba(45, 164, 78, 0.15)", color: "#2DA44E" }}>
                            <ScreenShareIcon />
                        </div>
                        <h3>Screen Sharing</h3>
                        <p>Share your screen, documents, or browser tabs with a single click.</p>
                    </div>

                    <div className="zoomFeatureCard">
                        <div className="zoomFeatureIcon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366F1" }}>
                            <ChatIcon />
                        </div>
                        <h3>In-Meeting Chat</h3>
                        <p>Send messages, share links, and collaborate in real time with everyone.</p>
                    </div>

                    <div className="zoomFeatureCard">
                        <div className="zoomFeatureIcon" style={{ background: "rgba(254, 88, 36, 0.15)", color: "#FE5824" }}>
                            <SecurityIcon />
                        </div>
                        <h3>Private & Encrypted</h3>
                        <p>Secure peer-to-peer WebRTC encryption for safe private conversations.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
