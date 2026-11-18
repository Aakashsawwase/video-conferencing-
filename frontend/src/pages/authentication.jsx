import React, { useState, useContext } from 'react';
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function Authentication() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [formState, setFormState] = useState(0); // 0 = Sign In, 1 = Sign Up
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { handleRegister, handleLogin } = useContext(AuthContext);

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (formState === 0) {
                if (!username.trim() || !password.trim()) {
                    setError("Please enter both username and password");
                    setLoading(false);
                    return;
                }
                await handleLogin(username, password);
            } else {
                if (!name.trim() || !username.trim() || !password.trim()) {
                    setError("Please fill in all fields");
                    setLoading(false);
                    return;
                }
                const result = await handleRegister(name, username, password);
                setMessage(result || "Registration successful! Please sign in.");
                setOpen(true);
                setFormState(0);
                setPassword("");
            }
        } catch (err) {
            console.log(err);
            const errMsg = err.response?.data?.message || err.message || "Authentication failed";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="zoomAuthContainer">
            <div className="zoomAuthCard">
                {/* BACK TO HOME */}
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#9CA3AF",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        marginBottom: "16px",
                        width: "fit-content"
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                    <span>Back to Home</span>
                </button>

                {/* LOGO & TITLE */}
                <div className="zoomAuthHeader">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                        <div className="zoomLogoBadge" style={{ width: 44, height: 44 }}>
                            <VideocamIcon fontSize="medium" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", marginBottom: "6px" }}>
                        {formState === 0 ? "Sign in to Zoom" : "Create your account"}
                    </h2>
                    <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
                        {formState === 0 ? "Enter your credentials to continue" : "Start hosting video calls in seconds"}
                    </p>
                </div>

                {/* TABS */}
                <div className="zoomAuthTabs">
                    <button
                        type="button"
                        onClick={() => { setFormState(0); setError(""); }}
                        className={`zoomAuthTab ${formState === 0 ? "zoomAuthTabActive" : ""}`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setFormState(1); setError(""); }}
                        className={`zoomAuthTab ${formState === 1 ? "zoomAuthTabActive" : ""}`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {formState === 1 && (
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#D1D5DB", marginBottom: "6px" }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="zoomJoinInput"
                                style={{ width: "100%" }}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#D1D5DB", marginBottom: "6px" }}>
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="zoomJoinInput"
                            style={{ width: "100%" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#D1D5DB", marginBottom: "6px" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="zoomJoinInput"
                            style={{ width: "100%" }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "10px 14px", color: "#FCA5A5", fontSize: "13px" }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="zoomJoinBtn"
                        style={{ height: "46px", marginTop: "8px", fontSize: "15px" }}
                    >
                        {loading ? "Processing..." : (formState === 0 ? "Sign In" : "Create Account")}
                    </button>
                </form>
            </div>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />
        </div>
    );
}