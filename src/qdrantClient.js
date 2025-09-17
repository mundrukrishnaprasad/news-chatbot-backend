import { QdrantClient } from '@qdrant/js-client-rest'; 
import { config } from "./config.js";

const qdrant = new QdrantClient({ url: config.QDRANT_URL });
console.log("✅ Qdrant client initialized");

export default qdrant;
