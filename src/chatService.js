import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";   // ✅ use central config

// Qdrant client
const qdrant = new QdrantClient({ url: config.QDRANT_URL });

// Gemini client
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Lazy-load embedder
let embedder;
async function getEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Embedding model loaded");
  }
  return embedder;
}

export async function chatWithNews(sessionId, userMessage) {
  try {
    // 1. Embed query
    const embed = await getEmbedder();
    const output = await embed(userMessage, { pooling: "mean", normalize: true });
    const queryVector = Array.from(output.data);

    // 2. Search in Qdrant
    const searchResult = await qdrant.search("news", {
      vector: queryVector,
      limit: 3,
    });

    if (!searchResult.length) {
      return "❌ Sorry, I couldn’t find relevant news right now.";
    }

    // 3. Build context
    const context = searchResult
      .map((r) => `Title: ${r.payload.title}\nText: ${r.payload.text}\nURL: ${r.payload.url}`)
      .join("\n\n");

    const prompt = `
You are a helpful AI news assistant. Use the following news snippets to answer the user’s question.

Context:
${context}

User Question: ${userMessage}

Answer clearly in 3–4 sentences and cite sources (with titles or URLs).
    `;

    try {
      // 4. Try Gemini
      const result = await model.generateContent(prompt);
      if (result?.response) {
        return result.response.text();
      } else {
        throw new Error("Empty Gemini response");
      }
    } catch (geminiErr) {
      console.error("⚠️ Gemini failed, falling back to raw news:", geminiErr.message);

      // 🔄 Fallback: return raw retrieved news
      const fallback = searchResult
        .map((r) => `📰 ${r.payload.title}\n${r.payload.text}\n(${r.payload.url})`)
        .join("\n\n");

      return `Here’s what I found (fallback mode):\n\n${fallback}`;
    }
  } catch (err) {
    console.error("❌ Chat error:", err);
    return "⚠️ Something went wrong while fetching news.";
  }
}
