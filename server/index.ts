import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { registerConnection, unregisterConnection, broadcastToRoom } from "./roomManager";

const app = Fastify({
  logger: true
});

// Register the WebSocket plugin
app.register(fastifyWebsocket);

// Setup the WebSocket route for workspace connections
app.register(async function (fastify) {
  fastify.get("/workspace/:documentId", { websocket: true }, (connection, req) => {
    const { documentId } = req.params as { documentId: string };
    
    // Extract the raw WebSocket from the fastify connection wrapper
    const socket = connection.socket;
    
    // Register this socket to the specific room
    registerConnection(documentId, socket);

    // Listen for incoming messages (CRDT binary updates)
    socket.on("message", (message) => {
      // Message is expected to be binary (Buffer) because Yjs encodes state to Uint8Array
      // Broadcast this raw payload to all other clients in the same room
      broadcastToRoom(documentId, socket, message as Buffer);
    });

    // Cleanup on disconnect
    socket.on("close", () => {
      unregisterConnection(documentId, socket);
    });

    socket.on("error", (err) => {
      console.error(`[WebSocket Error] Document ${documentId}:`, err);
      unregisterConnection(documentId, socket);
    });
  });
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`[SyncMesh Engine] Orchestration Server listening on ws://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
