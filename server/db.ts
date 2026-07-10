import mongoose, { Schema, Document } from "mongoose";

// In production, this would be your Atlas URI from environment variables
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/syncmesh";

export interface IDocumentSnapshot extends Document {
  documentId: string;
  binaryState: Buffer;
  lastUpdated: Date;
}

const DocumentSnapshotSchema = new Schema<IDocumentSnapshot>({
  documentId: { type: String, required: true, unique: true, index: true },
  binaryState: { type: Buffer, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const DocumentSnapshot = mongoose.model<IDocumentSnapshot>("DocumentSnapshot", DocumentSnapshotSchema);

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[SyncMesh] Connected to MongoDB Persistence Layer");
  } catch (error) {
    console.error("[SyncMesh] Error connecting to MongoDB:", error);
    // Don't crash the server if Mongo is down in dev, just warn
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
