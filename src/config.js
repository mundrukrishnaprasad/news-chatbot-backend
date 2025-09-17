import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "demo-key"
};
