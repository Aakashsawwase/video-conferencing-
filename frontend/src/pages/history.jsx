import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (e) {
                console.log("Could not fetch history:", e);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="zoomHistoryContainer">
            {/* TOP BAR */}
            <header className="zoomHomeNavbar">
                <div className="zoomBrand" onClick={() => navigate("/home")}>
                    <div className="zoomLogoBadge">
                        <VideocamIcon />
                    </div>
                    <span className="zoomBrandText">zoom<span>.us</span></span>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/home")}
                    className="zoomNavLink"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                    <ArrowBackIcon fontSize="small" />
                    <span>Back to Dashboard</span>
                </button>
            </header>

            {/* CONTENT */}
            <main className="zoomHistoryContent">
                <div className="zoomHistoryHeader">
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF" }}>Past Meetings</h1>
                        <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
                            View your meeting history and easily rejoin past sessions
                        </p>
                    </div>
                </div>

                {Array.isArray(meetings) && meetings.length > 0 ? (
                    <div>
                        {meetings.map((item, index) => (
                            <div key={item._id || index} className="zoomMeetingItemCard">
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                        <span className="meetingPill" style={{ fontSize: "14px", padding: "4px 12px" }}>
                                            {item.meetingCode}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#9CA3AF", fontSize: "13px" }}>
                                        <span>📅 {formatDate(item.date)}</span>
                                        <span>⏰ {formatTime(item.date)}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(item.meetingCode)}
                                        className="copyLinkBtn"
                                        style={{ height: "36px" }}
                                    >
                                        {copiedId === item.meetingCode ? (
                                            <CheckCircleIcon style={{ color: "#2DA44E", fontSize: 16 }} />
                                        ) : (
                                            <ContentCopyIcon style={{ fontSize: 14 }} />
                                        )}
                                        <span>{copiedId === item.meetingCode ? "Copied" : "Copy ID"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/${item.meetingCode}`)}
                                        className="zoomJoinBtn"
                                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 16px", height: "36px", fontSize: "13px" }}
                                    >
                                        <PlayArrowIcon fontSize="small" />
                                        <span>Rejoin</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "80px 20px", color: "#6B7280" }}>
                        <CalendarMonthIcon style={{ fontSize: 56, marginBottom: "16px", opacity: 0.5 }} />
                        <h3 style={{ fontSize: "18px", color: "#D1D5DB", marginBottom: "6px" }}>No Past Meetings</h3>
                        <p style={{ fontSize: "14px" }}>When you host or join meetings, they will appear here.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            className="zoomJoinBtn"
                            style={{ marginTop: "20px", height: "42px", padding: "0 24px" }}
                        >
                            Start a Meeting Now
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
