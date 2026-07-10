import Redis from "ioredis";

// Standard Redis port (6379)
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// We need two distinct clients: one for publishing, one for subscribing.
// A Redis client in "subscriber mode" cannot issue other commands (like PUBLISH).
export const redisPub = new Redis(REDIS_URL);
export const redisSub = new Redis(REDIS_URL);

redisPub.on("error", (err) => console.error("[Redis Pub Error]", err));
redisSub.on("error", (err) => console.error("[Redis Sub Error]", err));

redisPub.on("connect", () => console.log("[SyncMesh] Connected to Redis (Pub)"));
redisSub.on("connect", () => console.log("[SyncMesh] Connected to Redis (Sub)"));
