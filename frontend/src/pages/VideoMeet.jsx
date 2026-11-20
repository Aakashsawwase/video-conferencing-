import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, Tooltip, Snackbar } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import PanToolIcon from '@mui/icons-material/PanTool';

import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

const silence = () => {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    } catch (e) {
        return null;
    }
};

const black = ({ width = 640, height = 480 } = {}) => {
    try {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    } catch (e) {
        return null;
    }
};

const blackSilence = (...args) => {
    const tracks = [];
    const b = black(...args);
    if (b) tracks.push(b);
    const s = silence();
    if (s) tracks.push(s);
    return new MediaStream(tracks);
};

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    // --- FEATURE 1: Remote Participant Status Map ---
    let [participantsMap, setParticipantsMap] = useState({});

    // --- FEATURE 2: Device Selection ---
    let [audioDevices, setAudioDevices] = useState([]);
    let [videoDevices, setVideoDevices] = useState([]);
    let [selectedAudioId, setSelectedAudioId] = useState("");
    let [selectedVideoId, setSelectedVideoId] = useState("");
    let [showSettings, setShowSettings] = useState(false);

    // --- FEATURE 3: Raise Hand & Floating Reactions ---
    let [showReactionsMenu, setShowReactionsMenu] = useState(false);
    let [isHandRaised, setIsHandRaised] = useState(false);
    let [floatingEmojis, setFloatingEmojis] = useState([]);
    let [toastMessage, setToastMessage] = useState("");
    let [toastOpen, setToastOpen] = useState(false);

    // --- FEATURE 4: Local Meeting Recording ---
    let [isRecording, setIsRecording] = useState(false);
    let [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // UI states
    let [copied, setCopied] = useState(false);
    let [callDuration, setCallDuration] = useState(0);

    const roomCode = window.location.pathname.replace(/^\/+/, "") || "Meeting Room";

    useEffect(() => {
        getPermissions();
        loadDevices();
    }, []);

    // Timer effect once connected
    useEffect(() => {
        if (!askForUsername) {
            const timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [askForUsername]);

    // Recording duration timer
    useEffect(() => {
        let recTimer;
        if (isRecording) {
            recTimer = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0);
        }
        return () => clearInterval(recTimer);
    }, [isRecording]);

    const formatTimer = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const copyMeetingLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // ==========================================
    // FEATURE 2: DEVICE ENUMERATION & SWITCHING
    // ==========================================
    const loadDevices = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audios = devices.filter(d => d.kind === "audioinput");
            const videos = devices.filter(d => d.kind === "videoinput");
            setAudioDevices(audios);
            setVideoDevices(videos);
            if (audios.length > 0 && !selectedAudioId) setSelectedAudioId(audios[0].deviceId);
            if (videos.length > 0 && !selectedVideoId) setSelectedVideoId(videos[0].deviceId);
        } catch (e) {
            console.log("Error loading devices:", e);
        }
    };

    const switchCamera = async (deviceId) => {
        setSelectedVideoId(deviceId);
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            const newVideoTrack = newStream.getVideoTracks()[0];

            if (window.localStream) {
                const oldVideoTrack = window.localStream.getVideoTracks()[0];
                if (oldVideoTrack) {
                    oldVideoTrack.stop();
                    window.localStream.removeTrack(oldVideoTrack);
                }
                window.localStream.addTrack(newVideoTrack);
            }

            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            // Replace track in all peer connections
            for (let id in connections) {
                const pc = connections[id];
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === "video");
                if (videoSender) {
                    videoSender.replaceTrack(newVideoTrack);
                }
            }
        } catch (err) {
            console.log("Could not switch camera:", err);
        }
    };

    const switchMicrophone = async (deviceId) => {
        setSelectedAudioId(deviceId);
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
            const newAudioTrack = newStream.getAudioTracks()[0];

            if (window.localStream) {
                const oldAudioTrack = window.localStream.getAudioTracks()[0];
                if (oldAudioTrack) {
                    oldAudioTrack.stop();
                    window.localStream.removeTrack(oldAudioTrack);
                }
                window.localStream.addTrack(newAudioTrack);
            }

            // Replace track in all peer connections
            for (let id in connections) {
                const pc = connections[id];
                const senders = pc.getSenders();
                const audioSender = senders.find(s => s.track && s.track.kind === "audio");
                if (audioSender) {
                    audioSender.replaceTrack(newAudioTrack);
                }
            }
        } catch (err) {
            console.log("Could not switch microphone:", err);
        }
    };

    // ==========================================
    // FEATURE 3: FLOATING REACTIONS & RAISE HAND
    // ==========================================
    const triggerFloatingEmoji = (emoji) => {
        const id = Date.now() + Math.random();
        const leftPercent = Math.floor(20 + Math.random() * 60); // Random horizontal position 20-80%
        setFloatingEmojis(prev => [...prev, { id, emoji, left: leftPercent }]);
        setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(item => item.id !== id));
        }, 3000);
    };

    const sendReaction = (emoji) => {
        setShowReactionsMenu(false);
        triggerFloatingEmoji(emoji);
        if (socketRef.current) {
            socketRef.current.emit("user-reaction", { emoji, username: username || "Participant" });
        }
    };

    const toggleRaiseHand = () => {
        const newHandState = !isHandRaised;
        setIsHandRaised(newHandState);
        setShowReactionsMenu(false);
        if (socketRef.current) {
            socketRef.current.emit("raise-hand", { handRaised: newHandState, username: username || "Participant" });
        }
    };

    // ==========================================
    // FEATURE 4: LOCAL MEETING RECORDING
    // ==========================================
    const startRecording = async () => {
        try {
            let streamToRecord;
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                try {
                    streamToRecord = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: 30 },
                        audio: true
                    });
                } catch (e) {
                    console.log("Display capture canceled, falling back to local camera:", e);
                    streamToRecord = window.localStream;
                }
            } else {
                streamToRecord = window.localStream;
            }

            if (!streamToRecord) {
                alert("No active stream found to record.");
                return;
            }

            recordedChunksRef.current = [];
            const recorder = new MediaRecorder(streamToRecord, { mimeType: "video/webm" });

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = `zoom-meeting-${roomCode}-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                setToastMessage("Meeting recording saved and downloaded! 🎉");
                setToastOpen(true);
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setToastMessage("🔴 Recording started!");
            setToastOpen(true);
        } catch (err) {
            console.error("Recording error:", err);
            alert("Could not start recording: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // ==========================================
    // PERMISSIONS & SOCKET LIFECYCLE
    // ==========================================
    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => {
                        console.log(e);
                        setScreen(false);
                    });
            }
        }
    };

    const getPermissions = async () => {
        try {
            let videoPermission = false;
            let audioPermission = false;

            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoStream) {
                    videoPermission = true;
                    videoStream.getTracks().forEach(t => t.stop());
                }
            } catch (e) {
                console.log('Camera not available:', e.message);
            }

            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (audioStream) {
                    audioPermission = true;
                    audioStream.getTracks().forEach(t => t.stop());
                }
            } catch (e) {
                console.log('Microphone not available:', e.message);
            }

            setVideoAvailable(videoPermission);
            setAudioAvailable(audioPermission);

            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoPermission || audioPermission) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoPermission,
                    audio: audioPermission
                });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            } else {
                window.localStream = blackSilence();
                if (localVideoref.current) {
                    localVideoref.current.srcObject = window.localStream;
                }
            }
        } catch (error) {
            console.log("Error in getPermissions:", error);
            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
        }
    };

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(t => t.stop());
                }
            } catch (e) { console.log(e); }

            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            for (let id in connections) {
                connections[id].addStream(window.localStream);

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            }
        });
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            } catch (e) { }
        }
    };

    let getDislayMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            } catch (e) { console.log(e); }

            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            getUserMedia();
        });
    };

    let gotMessageFromServer = (fromId, message) => {
        try {
            var signal = JSON.parse(message);

            if (fromId !== socketIdRef.current) {
                if (!connections[fromId]) {
                    connections[fromId] = new RTCPeerConnection(peerConfigConnections);
                }

                if (signal.sdp) {
                    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                        if (signal.sdp.type === 'offer') {
                            connections[fromId].createAnswer().then((description) => {
                                connections[fromId].setLocalDescription(description).then(() => {
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                                }).catch(e => console.log(e));
                            }).catch(e => console.log(e));
                        }
                    }).catch(e => console.log(e));
                }

                if (signal.ice && connections[fromId]) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
                }
            }
        } catch (e) {
            console.log("Error in gotMessageFromServer:", e);
        }
    };

    let connectToSocketServer = () => {
        const isSecure = server_url.startsWith("https://");
        socketRef.current = io(server_url, { secure: isSecure, transports: ["websocket", "polling"] });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            // Join call with initial participant metadata
            socketRef.current.emit('join-call', window.location.href, {
                username: username || "Participant",
                audio: audio,
                video: video
            });
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            // Listen for Remote Status Changes (Mute / Camera)
            socketRef.current.on('status-change', (fromSocketId, status) => {
                setParticipantsMap(prev => ({
                    ...prev,
                    [fromSocketId]: {
                        ...(prev[fromSocketId] || {}),
                        audio: status.audio !== undefined ? status.audio : prev[fromSocketId]?.audio,
                        video: status.video !== undefined ? status.video : prev[fromSocketId]?.video
                    }
                }));
            });

            // Listen for Remote Emoji Reactions
            socketRef.current.on('user-reaction', (fromSocketId, data) => {
                triggerFloatingEmoji(data.emoji);
            });

            // Listen for Remote Hand Raise
            socketRef.current.on('raise-hand', (fromSocketId, data) => {
                setParticipantsMap(prev => ({
                    ...prev,
                    [fromSocketId]: {
                        ...(prev[fromSocketId] || {}),
                        handRaised: data.handRaised
                    }
                }));
                if (data.handRaised) {
                    setToastMessage(`${data.username || "A participant"} raised their hand ✋`);
                    setToastOpen(true);
                }
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((v) => v.socketId !== id));
                setParticipantsMap(prev => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                });
            });

            socketRef.current.on('user-joined', (id, clients, allParticipants) => {
                if (allParticipants) {
                    setParticipantsMap(allParticipants);
                }

                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: event.stream } : v
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });
    };

    // Toggle Video & Broadcast State
    let handleVideo = () => {
        const nextVideo = !video;
        setVideo(nextVideo);
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(t => t.enabled = nextVideo);
        }
        if (socketRef.current) {
            socketRef.current.emit("status-change", { video: nextVideo });
        }
    };

    // Toggle Audio & Broadcast State
    let handleAudio = () => {
        const nextAudio = !audio;
        setAudio(nextAudio);
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(t => t.enabled = nextAudio);
        }
        if (socketRef.current) {
            socketRef.current.emit("status-change", { audio: nextAudio });
        }
    };

    useEffect(() => {
        if (screen !== undefined && !askForUsername) {
            getDislayMedia();
        }
    }, [screen]);

    let handleScreen = () => {
        setScreen(!screen);
    };

    let handleEndCall = () => {
        if (isRecording) {
            stopRecording();
        }
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
            if (localVideoref.current && localVideoref.current.srcObject) {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        } catch (e) { }
        window.location.href = "/home";
    };

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    };

    let closeChat = () => {
        setModal(false);
    };

    let handleMessage = (e) => {
        setMessage(e.target.value);
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        if (!message.trim()) return;
        socketRef.current.emit('chat-message', message, username || "Participant");
        setMessage("");
    };

    let connect = () => {
        if (!username.trim()) {
            setUsername("Participant " + Math.floor(Math.random() * 900 + 100));
        }
        setAskForUsername(false);
        getMedia();
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.slice(0, 2).toUpperCase();
    };

    // ==========================================
    // RENDER LOBBY
    // ==========================================
    if (askForUsername === true) {
        return (
            <div className={styles.lobbyContainer}>
                <div className={styles.lobbyCard}>
                    <div className={styles.lobbyHeader}>
                        <h1 className={styles.lobbyTitle}>Ready to join?</h1>
                        <p className={styles.lobbySubtitle}>
                            Meeting ID: <span className={styles.meetingPill}>{roomCode}</span>
                        </p>
                    </div>

                    <div className={styles.lobbyPreviewWrapper}>
                        {video ? (
                            <video
                                ref={el => {
                                    localVideoref.current = el;
                                    if (el && window.localStream) el.srcObject = window.localStream;
                                }}
                                autoPlay
                                muted
                                playsInline
                                className={styles.lobbyVideo}
                            />
                        ) : (
                            <div className={styles.lobbyVideoOff}>
                                <div className={styles.lobbyAvatarCircle}>
                                    {getInitials(username)}
                                </div>
                                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Camera is turned off</span>
                            </div>
                        )}

                        <div className={styles.lobbyControlsOverlay}>
                            <Tooltip title={audio ? "Mute Microphone" : "Unmute Microphone"}>
                                <button
                                    type="button"
                                    onClick={handleAudio}
                                    className={`${styles.lobbyControlBtn} ${!audio ? styles.lobbyControlBtnActiveOff : ""}`}
                                >
                                    {audio ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                                </button>
                            </Tooltip>

                            <Tooltip title={video ? "Turn Camera Off" : "Turn Camera On"}>
                                <button
                                    type="button"
                                    onClick={handleVideo}
                                    className={`${styles.lobbyControlBtn} ${!video ? styles.lobbyControlBtnActiveOff : ""}`}
                                >
                                    {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                                </button>
                            </Tooltip>

                            <Tooltip title="Device Settings">
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(true)}
                                    className={styles.lobbyControlBtn}
                                >
                                    <SettingsIcon fontSize="small" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <form className={styles.lobbyForm} onSubmit={(e) => { e.preventDefault(); connect(); }}>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className={styles.lobbyInput}
                            autoFocus
                        />
                        <button type="submit" className={styles.lobbyJoinBtn}>
                            Join Meeting
                        </button>
                    </form>
                </div>

                {/* DEVICE SETTINGS MODAL IN LOBBY */}
                {showSettings && (
                    <div className={styles.modalBackdrop}>
                        <div className={styles.settingsCard}>
                            <div className={styles.settingsHeader}>
                                <div className={styles.settingsTitle}>
                                    <SettingsIcon />
                                    <span>Audio & Video Settings</span>
                                </div>
                                <IconButton onClick={() => setShowSettings(false)} style={{ color: "#9CA3AF" }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </div>

                            <div className={styles.settingsGroup}>
                                <label className={styles.settingsLabel}>
                                    <VideocamIcon fontSize="small" style={{ color: "#0E71EB" }} />
                                    <span>Camera</span>
                                </label>
                                <select
                                    value={selectedVideoId}
                                    onChange={(e) => switchCamera(e.target.value)}
                                    className={styles.settingsSelect}
                                >
                                    {videoDevices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.settingsGroup}>
                                <label className={styles.settingsLabel}>
                                    <MicIcon fontSize="small" style={{ color: "#2DA44E" }} />
                                    <span>Microphone</span>
                                </label>
                                <select
                                    value={selectedAudioId}
                                    onChange={(e) => switchMicrophone(e.target.value)}
                                    className={styles.settingsSelect}
                                >
                                    {audioDevices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.settingsFooter}>
                                <button type="button" onClick={() => setShowSettings(false)} className={styles.settingsDoneBtn}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // RENDER IN-CALL ZOOM ROOM
    // ==========================================
    const totalParticipants = videos.length + 1;

    return (
        <div className={styles.meetingContainer}>
            {/* FLOATING EMOJIS OVERLAY */}
            <div className={styles.floatingEmojisContainer}>
                {floatingEmojis.map(item => (
                    <div
                        key={item.id}
                        className={styles.floatingEmojiItem}
                        style={{ left: `${item.left}%` }}
                    >
                        {item.emoji}
                    </div>
                ))}
            </div>

            {/* TOP BAR */}
            <header className={styles.meetingTopBar}>
                <div className={styles.topBarLeft}>
                    <div className={styles.securityBadge}>
                        <SecurityIcon fontSize="inherit" />
                        <span>Encrypted</span>
                    </div>
                    <span className={styles.meetingIdBadge}>{roomCode}</span>
                    <button type="button" onClick={copyMeetingLink} className={styles.copyLinkBtn}>
                        {copied ? <CheckCircleIcon style={{ color: "#2DA44E", fontSize: 15 }} /> : <ContentCopyIcon style={{ fontSize: 14 }} />}
                        {copied ? "Link Copied!" : "Copy Link"}
                    </button>

                    {/* RECORDING STATUS PILL */}
                    {isRecording && (
                        <div className={styles.recordingBadge}>
                            <div className={styles.recordingDot} />
                            <span>REC {formatTimer(recordingDuration)}</span>
                        </div>
                    )}
                </div>

                <div className={styles.topBarCenter}>
                    <div className={styles.timerDot} />
                    <span>{formatTimer(callDuration)}</span>
                </div>

                <div className={styles.topBarRight}>
                    <Tooltip title="Device Settings">
                        <IconButton onClick={() => setShowSettings(true)} style={{ color: "#D1D5DB" }}>
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Leave Meeting">
                        <IconButton onClick={handleEndCall} style={{ color: "#EF4444" }}>
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            </header>

            {/* STAGE & CHAT */}
            <div className={styles.mainStage}>
                {/* VIDEO GRID */}
                <div className={styles.videoGrid}>
                    {/* LOCAL USER TILE */}
                    <div className={styles.videoCard}>
                        {isHandRaised && (
                            <div className={styles.handRaisedBadge}>
                                <span>✋ Hand Raised</span>
                            </div>
                        )}

                        {video ? (
                            <video
                                className={styles.videoElement}
                                ref={el => {
                                    localVideoref.current = el;
                                    if (el && window.localStream) el.srcObject = window.localStream;
                                }}
                                autoPlay
                                muted
                                playsInline
                            />
                        ) : (
                            <div className={styles.avatarFallback}>
                                <div className={styles.avatarCircle}>{getInitials(username)}</div>
                            </div>
                        )}
                        <div className={styles.participantNameTag}>
                            {audio ? (
                                <MicIcon fontSize="inherit" style={{ color: "#2DA44E" }} />
                            ) : (
                                <MicOffIcon fontSize="inherit" style={{ color: "#EF4444" }} />
                            )}
                            <span>{username || "You"} (You)</span>
                        </div>
                    </div>

                    {/* REMOTE PARTICIPANTS TILES */}
                    {videos.map((v) => {
                        const remoteState = participantsMap[v.socketId] || {};
                        const remoteName = remoteState.username || "Participant";
                        const isRemoteVideoOn = remoteState.video !== false;
                        const isRemoteAudioOn = remoteState.audio !== false;
                        const isRemoteHandRaised = remoteState.handRaised === true;

                        return (
                            <div key={v.socketId} className={styles.videoCard}>
                                {isRemoteHandRaised && (
                                    <div className={styles.handRaisedBadge}>
                                        <span>✋ Hand Raised</span>
                                    </div>
                                )}

                                {isRemoteVideoOn ? (
                                    <video
                                        className={styles.videoElement}
                                        data-socket={v.socketId}
                                        ref={ref => {
                                            if (ref && v.stream) {
                                                ref.srcObject = v.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                    />
                                ) : (
                                    <div className={styles.avatarFallback}>
                                        <div className={styles.avatarCircle}>{getInitials(remoteName)}</div>
                                    </div>
                                )}

                                <div className={styles.participantNameTag}>
                                    {isRemoteAudioOn ? (
                                        <MicIcon fontSize="inherit" style={{ color: "#2DA44E" }} />
                                    ) : (
                                        <MicOffIcon fontSize="inherit" style={{ color: "#EF4444" }} />
                                    )}
                                    <span>{remoteName}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* SLIDE-IN CHAT DRAWER */}
                {showModal && (
                    <aside className={styles.chatDrawer}>
                        <div className={styles.chatHeader}>
                            <span className={styles.chatHeaderTitle}>Meeting Chat</span>
                            <button type="button" onClick={closeChat} className={styles.chatCloseBtn}>
                                <CloseIcon fontSize="small" />
                            </button>
                        </div>

                        <div className={styles.chatMessagesContainer}>
                            {messages.length === 0 ? (
                                <div className={styles.chatEmptyState}>
                                    <p>No messages yet.</p>
                                    <p style={{ fontSize: "12px", marginTop: "4px" }}>Send a message to everyone in this call.</p>
                                </div>
                            ) : (
                                messages.map((item, index) => {
                                    const isYou = item.sender === (username || "You");
                                    return (
                                        <div key={index} className={styles.chatMessageItem}>
                                            <div className={styles.chatMessageHeader}>
                                                <span className={`${styles.chatSenderName} ${isYou ? styles.chatSenderNameYou : ""}`}>
                                                    {item.sender}
                                                </span>
                                                {item.time && <span style={{ fontSize: "11px", color: "#6B7280" }}>{item.time}</span>}
                                            </div>
                                            <div className={styles.chatMessageBubble}>{item.data}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form
                            className={styles.chatInputArea}
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={handleMessage}
                                className={styles.chatInputField}
                            />
                            <button type="submit" className={styles.chatSendBtn}>
                                <SendIcon fontSize="small" />
                            </button>
                        </form>
                    </aside>
                )}
            </div>

            {/* BOTTOM ZOOM DOCK */}
            <footer className={styles.bottomDock}>
                {/* Left group: Audio & Video */}
                <div className={styles.dockLeftGroup}>
                    <button
                        type="button"
                        onClick={handleAudio}
                        className={`${styles.dockButton} ${!audio ? styles.dockButtonOff : ""}`}
                    >
                        {audio ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                        <span>{audio ? "Mute" : "Unmute"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleVideo}
                        className={`${styles.dockButton} ${!video ? styles.dockButtonOff : ""}`}
                    >
                        {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                        <span>{video ? "Stop Video" : "Start Video"}</span>
                    </button>
                </div>

                {/* Center group: Participants, Chat, Share Screen, Reactions, Record */}
                <div className={styles.dockCenterGroup}>
                    <button type="button" className={styles.dockButton}>
                        <Badge badgeContent={totalParticipants} color="primary">
                            <PeopleIcon fontSize="small" />
                        </Badge>
                        <span>Participants</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { if (!showModal) { openChat(); } else { closeChat(); } }}
                        className={`${styles.dockButton} ${showModal ? styles.dockButtonActive : ""}`}
                    >
                        <Badge badgeContent={newMessages} color="primary">
                            <ChatIcon fontSize="small" />
                        </Badge>
                        <span>Chat</span>
                    </button>

                    {screenAvailable && (
                        <button
                            type="button"
                            onClick={handleScreen}
                            className={`${styles.dockButton} ${styles.shareScreenBtn} ${screen ? styles.shareScreenBtnActive : ""}`}
                        >
                            {screen ? <StopScreenShareIcon fontSize="small" /> : <ScreenShareIcon fontSize="small" />}
                            <span>{screen ? "Stop Share" : "Share Screen"}</span>
                        </button>
                    )}

                    {/* FEATURE 3: REACTIONS POPOVER TRIGGER */}
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
                            className={`${styles.dockButton} ${showReactionsMenu ? styles.dockButtonActive : ""}`}
                        >
                            <AddReactionIcon fontSize="small" />
                            <span>Reactions</span>
                        </button>

                        {showReactionsMenu && (
                            <div className={styles.reactionsPopover}>
                                <div className={styles.reactionsEmojiRow}>
                                    {["👏", "👍", "❤️", "😂", "😮", "🎉"].map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => sendReaction(emoji)}
                                            className={styles.reactionEmojiBtn}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleRaiseHand}
                                    className={`${styles.raiseHandToggleBtn} ${isHandRaised ? styles.raiseHandToggleBtnActive : ""}`}
                                >
                                    <PanToolIcon fontSize="small" />
                                    <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* FEATURE 4: LOCAL MEETING RECORDING */}
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`${styles.dockButton} ${isRecording ? styles.recordBtnActive : ""}`}
                    >
                        {isRecording ? <StopIcon fontSize="small" /> : <FiberManualRecordIcon fontSize="small" />}
                        <span>{isRecording ? "Stop Rec" : "Record"}</span>
                    </button>
                </div>

                {/* Right group: End Meeting */}
                <div className={styles.dockRightGroup}>
                    <button type="button" onClick={handleEndCall} className={styles.endCallBtn}>
                        <CallEndIcon fontSize="small" />
                        <span>End</span>
                    </button>
                </div>
            </footer>

            {/* DEVICE SETTINGS MODAL */}
            {showSettings && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.settingsCard}>
                        <div className={styles.settingsHeader}>
                            <div className={styles.settingsTitle}>
                                <SettingsIcon />
                                <span>Audio & Video Settings</span>
                            </div>
                            <IconButton onClick={() => setShowSettings(false)} style={{ color: "#9CA3AF" }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        <div className={styles.settingsGroup}>
                            <label className={styles.settingsLabel}>
                                <VideocamIcon fontSize="small" style={{ color: "#0E71EB" }} />
                                <span>Camera</span>
                            </label>
                            <select
                                value={selectedVideoId}
                                onChange={(e) => switchCamera(e.target.value)}
                                className={styles.settingsSelect}
                            >
                                {videoDevices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.settingsGroup}>
                            <label className={styles.settingsLabel}>
                                <MicIcon fontSize="small" style={{ color: "#2DA44E" }} />
                                <span>Microphone</span>
                            </label>
                            <select
                                value={selectedAudioId}
                                onChange={(e) => switchMicrophone(e.target.value)}
                                className={styles.settingsSelect}
                            >
                                {audioDevices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.settingsFooter}>
                            <button type="button" onClick={() => setShowSettings(false)} className={styles.settingsDoneBtn}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            <Snackbar
                open={toastOpen}
                autoHideDuration={3000}
                onClose={() => setToastOpen(false)}
                message={toastMessage}
            />
        </div>
    );
}
