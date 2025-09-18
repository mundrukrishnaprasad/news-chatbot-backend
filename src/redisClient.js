import Redis from "ioredis";
import { config } from "./config.js";

const redis = new Redis(config.REDIS_URL);

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis error", err));

export default redis;
