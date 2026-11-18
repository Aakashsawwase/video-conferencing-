import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
app.set("port", PORT);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Zoom clone backend is running" });
});

app.use("/api/v1/users", userRoutes);

const start = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zoom";
    try {
        const connectionDb = await mongoose.connect(mongoUri);
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
    } catch (err) {
        console.error(`Failed to connect to primary MongoDB at ${mongoUri}:`, err.message);
        // Fallback to local MongoDB if primary fails
        if (mongoUri !== "mongodb://127.0.0.1:27017/zoom") {
            try {
                console.log("Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/zoom)...");
                const fallbackDb = await mongoose.connect("mongodb://127.0.0.1:27017/zoom");
                console.log(`Fallback MONGO Connected DB Host: ${fallbackDb.connection.host}`);
            } catch (fallbackErr) {
                console.error("Local MongoDB fallback also failed:", fallbackErr.message);
            }
        }
    }

    server.listen(app.get("port"), () => {
        console.log(`LISTENING ON PORT ${app.get("port")}`);
    });
};

start();