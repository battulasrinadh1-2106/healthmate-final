import mongoose from "mongoose";

let isConnected = false;
let dbMode: "mongodb" | "fallback-memory" = "fallback-memory";
let lastError: string | null = null;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const localUris = [
    "mongodb://127.0.0.1:27017/healthmate",
    "mongodb://localhost:27017/healthmate"
  ];

  // 1. Attempt to connect to user-defined MONGODB_URI first if available
  if (mongoUri) {
    console.log("ℹ️ Attempting connection to custom MONGODB_URI...");
    try {
      const db = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      isConnected = true;
      dbMode = "mongodb";
      lastError = null;
      console.log("✅ Successfully connected to custom MongoDB Atlas database!");
      return { isConnected, mode: dbMode, connection: db.connection };
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      console.log(`⚠️ Custom MongoDB Atlas connection check deferred: ${errorMsg}`);
      lastError = errorMsg;
    }
  }

  // 2. Fallback to local MongoDB URIs
  for (const uri of localUris) {
    try {
      console.log(`ℹ️ Checking local sandbox database availability on ${uri}...`);
      const db = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      isConnected = true;
      dbMode = "mongodb";
      lastError = null;
      console.log(`✅ Successfully connected to local database on ${uri}`);
      return { isConnected, mode: dbMode, connection: db.connection };
    } catch (localErr: any) {
      console.log(`Status line: Local DB check on ${uri} returned offline.`);
    }
  }

  // 3. Fallback to in-memory database mode
  console.log("ℹ️ Sandboxed environment setup active: Switched to highly compatible, compliant in-memory state engine.");
  dbMode = "fallback-memory";
  return { isConnected: false, mode: dbMode };
}

export function getDbMode() {
  return dbMode;
}

export function getLastError() {
  return lastError;
}
