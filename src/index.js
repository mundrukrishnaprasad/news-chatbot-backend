import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config } from "./config.js";
import router from "./routes.js";
import dotenv from "dotenv";

dotenv.config(); // Load .env

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);

const server = http.createServer(app);

// Socket.IO for streaming
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected", socket.id);

  socket.on("chat", async ({ sessionId, message }) => {
    // Mock streaming (word by word)
    const reply = `This is a streamed mock response for: ${message}`;
    const words = reply.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      socket.emit("chat-stream", { token: words[i] });
    }
    socket.emit("chat-done");
  });
});

// ✅ Environment variable checks
console.log("🔧 Loaded Config:");
console.log("   PORT =", config.PORT);
console.log("   QDRANT_URL =", process.env.QDRANT_URL || "❌ Missing");
console.log("   REDIS_URL =", process.env.REDIS_URL || "❌ Missing");
console.log("   GEMINI_API_KEY =", process.env.GEMINI_API_KEY ? "✅ Present" : "❌ Missing");

// Start server
server.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
});
