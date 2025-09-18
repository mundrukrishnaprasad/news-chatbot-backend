import fetch from "node-fetch";
import Parser from "rss-parser";
import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";
import { config } from "./config.js";

// ✅ Qdrant client with optional API key
const qdrantOptions = { url: config.QDRANT_URL };
if (config.QDRANT_API_KEY) {
  qdrantOptions.apiKey = config.QDRANT_API_KEY;
}
const qdrant = new QdrantClient(qdrantOptions);

const parser = new Parser();

// Load local embedding model
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

// ✅ Step 1: Fetch RSS
async function fetchArticles() {
  const feed = await parser.parseURL("http://feeds.bbci.co.uk/news/rss.xml"); // BBC News
  return feed.items.map(item => ({
    title: item.title,
    url: item.link,
    content: item.contentSnippet || ""
  }));
}

// ✅ Split long text into chunks
function chunkText(text, maxWords = 50) {
  const words = text.split(" ");
  let chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

// ✅ Ingest into Qdrant
async function ingest() {
  console.log("🚀 Fetching news articles...");
  const articles = await fetchArticles();

  // Create collection if not exists
  await qdrant.createCollection("news", {
    vectors: { size: 384, distance: "Cosine" }
  }).catch(() => console.log("ℹ️ Collection already exists"));

  let points = [];
  let idCounter = 1;

  for (const article of articles.slice(0, 50)) {
    const chunks = chunkText(article.content, 50);
    for (const chunk of chunks) {
      const output = await embedder(chunk, { pooling: "mean", normalize: true });
      const embedding = Array.from(output.data);

      points.push({
        id: idCounter++,
        vector: embedding,
        payload: {
          title: article.title,
          url: article.url,
          text: chunk
        }
      });
    }
  }

  await qdrant.upsert("news", { points });
  console.log(`✅ Ingested ${points.length} chunks into Qdrant!`);
}

ingest().catch(err => console.error("❌ Ingest error:", err));
