// backend/src/config/bootstrap.js — must be the FIRST import in server.js.
// Makes the app start with zero manual setup: creates .env, generates a JWT secret, fixes the working directory.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(backendRoot); // uploads/, data/ and eng.traineddata are resolved relative to backend/

const envPath = path.join(backendRoot, '.env');
const examplePath = path.join(backendRoot, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) fs.copyFileSync(examplePath, envPath);
dotenv.config({ path: envPath });

if (!process.env.JWT_SECRET) {
  const secret = crypto.randomBytes(32).toString('hex');
  try { fs.appendFileSync(envPath, `\nJWT_SECRET=${secret}\n`); } catch { /* read-only: secret lives for this run only */ }
  process.env.JWT_SECRET = secret;
}
process.env.NODE_ENV ||= 'development';
