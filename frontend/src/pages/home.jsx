import React, { useContext, useState, useEffect } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';
import VideocamIcon from '@mui/icons-material/Videocam';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [copied, setCopied] = useState(false);

    const { addToUserHistory } = useContext(AuthContext);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatClockTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatClockDate = (date) => {
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    const handleJoinVideoCall = async (codeToJoin) => {
        const code = (codeToJoin || meetingCode).trim();
        if (!code) {
            alert("Please enter a meeting code or ID");
            return;
        }
        try {
            await addToUserHistory(code);
        } catch (e) {
            console.log("Could not record to history:", e);
        }
        navigate(`/${code}`);
    };

    const handleStartNewMeeting = () => {
        // Generate a clean Zoom-style meeting ID
        const randomId = Math.floor(100000000 + Math.random() * 900000000).toString();
        const formattedCode = `${randomId.slice(0, 3)}-${randomId.slice(3, 6)}-${randomId.slice(6, 9)}`;
        handleJoinVideoCall(formattedCode);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const handleCopyQuickLink = () => {
        const sampleId = "instant-meet-" + Math.floor(1000 + Math.random() * 9000);
        navigator.clipboard.writeText(`${window.location.origin}/${sampleId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="zoomHomeContainer">
            {/* TOP NAVBAR */}
            <header className="zoomHomeNavbar">
                <div className="zoomBrand" onClick={() => navigate("/home")}>
                    <div className="zoomLogoBadge">
                        <VideocamIcon />
                    </div>
                    <span className="zoomBrandText">zoom<span>.us</span></span>
                </div>

                <div className="zoomHomeNavRight">
                    <button
                        type="button"
                        onClick={() => navigate("/history")}
                        className="zoomNavLink"
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <HistoryIcon fontSize="small" />
                        <span>Meeting History</span>
                    </button>

                    <div className="zoomUserPill">
                        <div className="zoomUserAvatar">Z</div>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>Logged In</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="zoomNavLink"
                        style={{ display: "flex", alignItems: "center", gap: "4px", color: "#EF4444" }}
                    >
                        <LogoutIcon fontSize="small" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            {/* DASHBOARD BODY */}
            <main className="zoomHomeMain">
                <div className="zoomHomeContentWrapper">
                    {/* LEFT PANEL: 4 ICONIC ZOOM TILES */}
                    <div className="zoomTilesGrid">
                        {/* 1. New Meeting (Orange) */}
                        <div className="zoomActionTile" onClick={handleStartNewMeeting}>
                            <div className="zoomTileIconBox tileOrange">
                                <VideocamIcon style={{ fontSize: 32 }} />
                            </div>
                            <span className="zoomTileLabel">New Meeting</span>
                        </div>

                        {/* 2. Join (Blue) */}
                        <div
                            className="zoomActionTile"
                            onClick={() => {
                                const input = document.getElementById("meetingCodeInput");
                                if (input) input.focus();
                            }}
                        >
                            <div className="zoomTileIconBox tileBlue">
                                <AddBoxIcon style={{ fontSize: 32 }} />
                            </div>
                            <span className="zoomTileLabel">Join Meeting</span>
                        </div>

                        {/* 3. Share Screen (Green) */}
                        <div className="zoomActionTile" onClick={handleStartNewMeeting}>
                            <div className="zoomTileIconBox tileGreen">
                                <ScreenShareIcon style={{ fontSize: 32 }} />
                            </div>
                            <span className="zoomTileLabel">Share Screen</span>
                        </div>

                        {/* 4. History (Purple) */}
                        <div className="zoomActionTile" onClick={() => navigate("/history")}>
                            <div className="zoomTileIconBox tilePurple">
                                <HistoryIcon style={{ fontSize: 32 }} />
                            </div>
                            <span className="zoomTileLabel">Past Meetings</span>
                        </div>
                    </div>

                    {/* RIGHT PANEL: CLOCK & QUICK JOIN */}
                    <div className="zoomDashboardWidget">
                        <div className="zoomClockHeader">
                            <div className="zoomClockTime">{formatClockTime(currentTime)}</div>
                            <div className="zoomClockDate">{formatClockDate(currentTime)}</div>
                        </div>

                        <form
                            className="zoomQuickJoinBox"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleJoinVideoCall();
                            }}
                        >
                            <label htmlFor="meetingCodeInput">Join with a Meeting ID or Code</label>
                            <div className="zoomInputGroup">
                                <input
                                    id="meetingCodeInput"
                                    type="text"
                                    placeholder="Enter Meeting ID (e.g. 123-456-789)"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    className="zoomJoinInput"
                                />
                                <button type="submit" className="zoomJoinBtn">
                                    Join
                                </button>
                            </div>
                        </form>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>Generate instant invite link</span>
                            <button
                                type="button"
                                onClick={handleCopyQuickLink}
                                className="copyLinkBtn"
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                                {copied ? <CheckCircleIcon style={{ color: "#2DA44E", fontSize: 15 }} /> : <ContentCopyIcon style={{ fontSize: 13 }} />}
                                <span>{copied ? "Link Copied!" : "Copy Quick Link"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(HomeComponent);