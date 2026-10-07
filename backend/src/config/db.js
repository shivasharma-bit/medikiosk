// backend/src/config/db.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';

let isConnected = false;
let embedded = null;

// Built-in MongoDB (no installation needed). Data is kept in backend/data/mongo between runs.
// Stored OUTSIDE the project folder (OneDrive sync locks live database files and makes startup fail).
function dataDir() {
  if (process.env.MEDIKIOSK_DATA_DIR) return process.env.MEDIKIOSK_DATA_DIR;
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'MediKiosk', 'mongo');
}

async function startEmbedded() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = dataDir();
  fs.mkdirSync(dbPath, { recursive: true });
  console.log(`[DB] Starting built-in database (data folder: ${dbPath})`);
  console.log('[DB] First start can take 1-3 minutes (antivirus scans the database engine). Please wait...');
  embedded = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', launchTimeout: 180000 },
  });
  return embedded.getUri();
}

export async function connectDB(uri) {
  if (isConnected) return;
  try {
    const useEmbedded = !uri || uri === 'embedded';
    const target = useEmbedded ? await startEmbedded() : uri;
    await mongoose.connect(target, {
      serverSelectionTimeoutMS: 15000,
      ...(useEmbedded && { dbName: 'medikiosk' }),
    });
    isConnected = true;
    console.log(`[DB] MongoDB connected (${useEmbedded ? 'built-in' : mongoose.connection.host})`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    console.error('[DB] Fix: wait and run start.bat again, or use a free cloud database: put a MongoDB Atlas connection string after MONGODB_URI= in backend/.env');
    if (embedded) await embedded.stop({ doCleanup: false }).catch(() => {});
    process.exit(1);
  }
}

export async function closeDB() {
  await mongoose.disconnect().catch(() => {});
  if (embedded) await embedded.stop({ doCleanup: false }).catch(() => {});
}

mongoose.connection.on('disconnected', () => { isConnected = false; });
