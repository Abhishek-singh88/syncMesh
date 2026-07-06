import type { WebSocket } from "ws";

// Global Room Connection State Tracking Map
// Maps roomId (e.g., a document ID) to a Set of active WebSocket connections
const activeRooms = new Map<string, Set<WebSocket>>();

export function registerConnection(roomId: string, socket: WebSocket) {
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, new Set());
  }
  activeRooms.get(roomId)!.add(socket);
  console.log(`[RoomManager] Socket joined room: ${roomId}. Total clients: ${activeRooms.get(roomId)?.size}`);
}

export function unregisterConnection(roomId: string, socket: WebSocket) {
  const room = activeRooms.get(roomId);
  if (room) {
    room.delete(socket);
    console.log(`[RoomManager] Socket left room: ${roomId}. Total clients: ${room.size}`);
    
    // Cleanup empty rooms to prevent memory leaks
    if (room.size === 0) {
      activeRooms.delete(roomId);
      console.log(`[RoomManager] Room ${roomId} is empty and was destroyed.`);
    }
  }
}

export function broadcastToRoom(roomId: string, senderSocket: WebSocket, message: Buffer | Uint8Array) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  // Fan out the binary CRDT update to all other connected clients in the room
  for (const client of room) {
    if (client !== senderSocket && client.readyState === 1 /* OPEN */) {
      client.send(message);
    }
  }
}
