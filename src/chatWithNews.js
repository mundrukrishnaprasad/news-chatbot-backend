import fetch from "node-fetch";
import { getHistory, saveMessage } from "./redisService.js";

const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];

// Call Gemini API
async function callGemini(model, messages) {
  const version = model.includes("pro") ? "v1" : "v1beta";

  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: messages })
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error.message);

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "⚠️ Sorry, I couldn’t generate a response."
  );
}

// Main function with memory + retry
export async function chatWithNews(userMessage, sessionId) {
  const history = await getHistory(sessionId);

  const messages = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  messages.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔮 Trying ${model}, attempt ${attempt}`);
        const response = await callGemini(model, messages);

        // Save both user and assistant messages
        await saveMessage(sessionId, "user", userMessage);
        await saveMessage(sessionId, "model", response);

        return response;
      } catch (err) {
        console.warn(`⚠️ Gemini failed on ${model} (attempt ${attempt}):`, err.message);
        await new Promise((res) => setTimeout(res, 1500 * attempt)); // backoff
      }
    }
  }

  return "⚠️ Gemini service is overloaded. Please try again later.";
}
