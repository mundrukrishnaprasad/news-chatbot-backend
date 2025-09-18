import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

await redisClient.connect(); // Only for ES modules

// Save a message to Redis as part of a session
export async function saveMessage(sessionId, role, text) {
  const message = { role, text };
  await redisClient.rPush(`chat:${sessionId}`, JSON.stringify(message));
}

// Get full chat history from Redis
export async function getHistory(sessionId) {
  const messages = await redisClient.lRange(`chat:${sessionId}`, 0, -1);
  return messages.map(msg => JSON.parse(msg));
}
