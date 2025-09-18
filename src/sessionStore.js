import Redis from "ioredis";
import { config } from "./config.js";

const redis = new Redis(config.REDIS_URL);

// Sessions will expire automatically after 1 hour
const SESSION_TTL = 3600; // seconds

// Create a new session (empty chat history)
export async function createSession(sessionId) {
  await redis.set(`session:${sessionId}`, JSON.stringify([]), "EX", SESSION_TTL);
}

// Reset a session (clear its history)
export async function resetSession(sessionId) {
  await redis.del(`session:${sessionId}`);
}

// Add a message to session history
export async function addMessage(sessionId, sender, text) {
  const key = `session:${sessionId}`;
  let history = await redis.get(key);
  history = history ? JSON.parse(history) : [];
  history.push({ sender, text });
  await redis.set(key, JSON.stringify(history), "EX", SESSION_TTL); // refresh TTL
}

// Get chat history
export async function getHistory(sessionId) {
  const key = `session:${sessionId}`;
  const history = await redis.get(key);
  return history ? JSON.parse(history) : [];
}
