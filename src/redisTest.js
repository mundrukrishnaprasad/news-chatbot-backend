// src/redisTest.js
import client from "./redisClient.js";

async function testRedis() {
  try {
    await client.set("ping", "pong");
    const value = await client.get("ping");
    console.log("🔑 Redis test:key =", value);
  } catch (err) {
    console.error("🔥 Redis Test Error:", err);
  } finally {
    await client.disconnect();
  }
}

testRedis();
