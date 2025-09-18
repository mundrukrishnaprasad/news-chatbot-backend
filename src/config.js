import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,

  // Redis
  REDIS_URL: process.env.REDIS_URL,

  // Qdrant
  QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333",
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || null,

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "demo-key",
};
