import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let participants = {};

const getRoomOfSocket = (socketId) => {
    for (const [roomKey, clientIds] of Object.entries(connections)) {
        if (Array.isArray(clientIds) && clientIds.includes(socketId)) {
            return roomKey;
        }
    }
    return null;
};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-call", (path, userData = {}) => {
            let roomKey = path;
            try {
                const parsed = new URL(path);
                roomKey = parsed.pathname.replace(/^\/+/, "");
            } catch (e) {
                roomKey = String(path).replace(/^\/+/, "");
            }

            if (!roomKey) roomKey = "default-room";

            if (connections[roomKey] === undefined) {
                connections[roomKey] = [];
            }
            connections[roomKey].push(socket.id);

            timeOnline[socket.id] = new Date();

            participants[socket.id] = {
                username: userData.username || "Participant",
                audio: userData.audio !== false,
                video: userData.video !== false,
                handRaised: false
            };

            for (let a = 0; a < connections[roomKey].length; a++) {
                io.to(connections[roomKey][a]).emit(
                    "user-joined",
                    socket.id,
                    connections[roomKey],
                    participants
                );
            }

            if (messages[roomKey] !== undefined) {
                for (let a = 0; a < messages[roomKey].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[roomKey][a]["data"],
                        messages[roomKey][a]["sender"],
                        messages[roomKey][a]["socket-id-sender"]
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const matchingRoom = getRoomOfSocket(socket.id);

            if (matchingRoom && connections[matchingRoom]) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({ sender: sender, data: data, "socket-id-sender": socket.id });
                console.log("message in room", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // Remote Mute/Video Status Sync
        socket.on("status-change", (status) => {
            if (participants[socket.id]) {
                if (status.audio !== undefined) participants[socket.id].audio = status.audio;
                if (status.video !== undefined) participants[socket.id].video = status.video;
            }
            const matchingRoom = getRoomOfSocket(socket.id);
            if (matchingRoom && connections[matchingRoom]) {
                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("status-change", socket.id, status);
                });
            }
        });

        // Floating Emoji Reaction
        socket.on("user-reaction", (data) => {
            const matchingRoom = getRoomOfSocket(socket.id);
            if (matchingRoom && connections[matchingRoom]) {
                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("user-reaction", socket.id, data);
                });
            }
        });

        // Raise Hand Sync
        socket.on("raise-hand", (data) => {
            if (participants[socket.id]) {
                participants[socket.id].handRaised = data.handRaised;
            }
            const matchingRoom = getRoomOfSocket(socket.id);
            if (matchingRoom && connections[matchingRoom]) {
                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("raise-hand", socket.id, data);
                });
            }
        });

        socket.on("disconnect", () => {
            delete timeOnline[socket.id];
            delete participants[socket.id];

            for (const [key, clientIds] of Object.entries(connections)) {
                if (Array.isArray(clientIds) && clientIds.includes(socket.id)) {
                    clientIds.forEach((id) => {
                        if (id !== socket.id) {
                            io.to(id).emit("user-left", socket.id);
                        }
                    });

                    const index = clientIds.indexOf(socket.id);
                    if (index !== -1) {
                        clientIds.splice(index, 1);
                    }

                    if (clientIds.length === 0) {
                        delete connections[key];
                    }
                }
            }
        });
    });

    return io;
};
