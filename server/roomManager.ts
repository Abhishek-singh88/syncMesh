import type { WebSocket } from "ws";
import * as Y from "yjs";
import { redisPub, redisSub } from "./redis";
import { DocumentSnapshot } from "./db";
import { Debouncer } from "./debouncer";
import crypto from "crypto";

// Extend standard WebSocket to hold our Session ID for Rate Limiting
export interface SyncSocket extends WebSocket {
  sessionId?: string;
}

const localActiveRooms = new Map<string, Set<SyncSocket>>();
const localDocs = new Map<string, Y.Doc>();
const writeDebouncer = new Debouncer(2500);

// Global listener for Pub/Sub
redisSub.on("messageBuffer", (channelBuffer, messageBuffer) => {
  const channel = channelBuffer.toString();
  
  if (channel.startsWith("room:")) {
    const roomId = channel.split(":")[1];
    
    const doc = localDocs.get(roomId);
    if (doc) {
      Y.applyUpdate(doc, messageBuffer);
    }

    const room = localActiveRooms.get(roomId);
    if (room) {
      for (const client of room) {
        if (client.readyState === 1) {
          client.send(messageBuffer);
        }
      }
    }
  }
});

async function flushToDatabase(roomId: string) {
  try {
    const cacheKey = `doc_cache:${roomId}`;
    const binaryState = await redisPub.getBuffer(cacheKey);
    
    if (!binaryState) {
      return;
    }

    await DocumentSnapshot.findOneAndUpdate(
      { documentId: roomId },
      { 
        documentId: roomId,
        binaryState: binaryState,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`[Debouncer] Successfully flushed ${roomId} to MongoDB.`);
  } catch (err) {
    console.error(`[Debouncer] MongoDB flush failed for ${roomId}:`, err);
  }
}

export async function registerConnection(roomId: string, socket: SyncSocket) {
  // Generate a unique session ID to track this connection for Rate Limiting
  socket.sessionId = crypto.randomUUID();

  let room = localActiveRooms.get(roomId);
  
  if (!room) {
    room = new Set();
    localActiveRooms.set(roomId, room);
    
    const channelName = `room:${roomId}`;
    redisSub.subscribe(channelName);
    
    const doc = new Y.Doc();
    localDocs.set(roomId, doc);

    const cacheKey = `doc_cache:${roomId}`;
    let initialState = await redisPub.getBuffer(cacheKey);

    if (initialState) {
      Y.applyUpdate(doc, initialState);
    } else {
      const dbSnapshot = await DocumentSnapshot.findOne({ documentId: roomId });
      if (dbSnapshot && dbSnapshot.binaryState) {
        Y.applyUpdate(doc, dbSnapshot.binaryState);
        await redisPub.set(cacheKey, dbSnapshot.binaryState);
      }
    }
  }
  
  room.add(socket);
  
  const currentDoc = localDocs.get(roomId);
  if (currentDoc) {
    const currentState = Y.encodeStateAsUpdate(currentDoc);
    socket.send(currentState);
  }
  
  console.log(`[RoomManager] Socket ${socket.sessionId} joined ${roomId}.`);
}

export function unregisterConnection(roomId: string, socket: SyncSocket) {
  const room = localActiveRooms.get(roomId);
  if (room) {
    room.delete(socket);
    console.log(`[RoomManager] Socket ${socket.sessionId} left ${roomId}.`);
    
    if (room.size === 0) {
      localActiveRooms.delete(roomId);
      localDocs.delete(roomId);
      redisSub.unsubscribe(`room:${roomId}`);
      
      writeDebouncer.forceFlush(roomId, () => flushToDatabase(roomId));
    }
  }
}

/**
 * Validates the socket against a Redis-backed Sliding Window Rate Limiter.
 * Max 200 operations per second per session.
 */
async function isRateLimited(sessionId: string): Promise<boolean> {
  const currentSecond = Math.floor(Date.now() / 1000);
  const rateLimitKey = `rate_limit:${sessionId}:${currentSecond}`;

  // Execute an atomic Redis pipeline
  const pipeline = redisPub.multi();
  pipeline.incr(rateLimitKey);
  pipeline.expire(rateLimitKey, 2); // 2 second TTL to clean up old buckets
  
  const results = await pipeline.exec();
  
  if (results && results[0]) {
    // The result of `incr`
    const count = results[0][1] as number;
    if (count > 200) {
      return true;
    }
  }
  return false;
}

export async function broadcastToRoom(roomId: string, senderSocket: SyncSocket, message: Buffer | Uint8Array) {
  if (!senderSocket.sessionId) return;

  // 1. Check Rate Limit
  const throttled = await isRateLimited(senderSocket.sessionId);
  if (throttled) {
    console.warn(`[Security] Socket ${senderSocket.sessionId} exceeded 200 ops/sec! Dropping payload.`);
    // Optionally send an error code back to the client
    // senderSocket.send(JSON.stringify({ error: "Rate limit exceeded" }));
    return;
  }

  const payload = Buffer.isBuffer(message) ? message : Buffer.from(message);
  
  // 2. Broadcast to other nodes
  redisPub.publish(`room:${roomId}`, payload);

  // 3. Apply local state
  const doc = localDocs.get(roomId);
  if (doc) {
    Y.applyUpdate(doc, payload);
    
    const fullState = Buffer.from(Y.encodeStateAsUpdate(doc));
    redisPub.set(`doc_cache:${roomId}`, fullState);
    
    writeDebouncer.registerActivity(roomId, () => flushToDatabase(roomId));
  }
}
