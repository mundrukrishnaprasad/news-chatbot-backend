import express from "express";
import redis from "./redisClient.js";
import { chatWithNews } from "./chatService.js";

const router = express.Router();

// ✅ Health check route
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Create new session
router.post("/session", async (req, res) => {
  const sessionId = Date.now().toString();
  await redis.del(`session:${sessionId}:history`);
  res.json({ sessionId });
});

// ✅ Reset session history
router.post("/session/:id/reset", async (req, res) => {
  await redis.del(`session:${req.params.id}:history`);
  res.json({ ok: true });
});

// ✅ Send user message and get chatbot reply
router.post("/session/:id/message", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message in request body." });
  }

  try {
    const reply = await chatWithNews(req.params.id, message);

    // Save user message and bot reply to Redis history (Redis v4)
    const historyKey = `session:${req.params.id}:history`;
    await redis.rPush(historyKey, JSON.stringify({ sender: "user", text: message }));
    await redis.rPush(historyKey, JSON.stringify({ sender: "bot", text: reply }));

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error processing message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Fetch full chat history
router.get("/session/:id/history", async (req, res) => {
  const historyKey = `session:${req.params.id}:history`;
  const messages = await redis.lRange(historyKey, 0, -1); // Redis v4 method
  const parsed = messages.map(m => JSON.parse(m));
  res.json(parsed);
});

export default router;
