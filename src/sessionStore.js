let client;

export function initSessionStore(redisClient) {
  client = redisClient;
}

export async function addMessage(sessionId, role, message) {
  await client.rPush(`session:${sessionId}`, JSON.stringify({ role, message }));
}

export async function getHistory(sessionId) {
  const messages = await client.lRange(`session:${sessionId}`, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
}

export async function createSession(sessionId) {
  await client.del(`session:${sessionId}`);
}

export async function resetSession(sessionId) {
  await client.del(`session:${sessionId}`);
}
