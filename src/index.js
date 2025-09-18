import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes.js"; // Optional API routes
import { chatWithNews } from "./chatWithNews.js"; // Gemini chat logic
import { saveMessage, getHistory } from "./redisService.js"; // Redis memory

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Optional API routes
app.use("/api", router);

// Optional debug history endpoint
app.get("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const history = await getHistory(sessionId);
    res.json({ sessionId, history });
  } catch (err) {
    console.error("❌ Failed to load history:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected", socket.id);

  socket.on("chat", async ({ sessionId, message }) => {
    try {
      // Save user message to Redis
      await saveMessage(sessionId, "user", message);

      // Generate response using chat history
      const reply = await chatWithNews(message, sessionId);

      // Stream response word-by-word
      const words = reply.split(" ");
      for (const word of words) {
        await new Promise((r) => setTimeout(r, 120)); // 120ms delay per word
        socket.emit("chat-stream", { token: word });
      }

      socket.emit("chat-done");

      // Save bot reply to Redis
      await saveMessage(sessionId, "model", reply);

    } catch (err) {
      console.error("❌ Error in chat:", err);
      socket.emit("chat-error", { error: "Internal Server Error" });
    }
  });
});

// ✅ Config logs
console.log("🔧 Loaded Config:");
console.log("   PORT =", process.env.PORT || 5001);
console.log("   QDRANT_URL =", process.env.QDRANT_URL || "❌ Missing");
console.log("   GEMINI_API_KEY =", process.env.GEMINI_API_KEY ? "✅ Present" : "❌ Missing");

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
