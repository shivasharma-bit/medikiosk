// backend/src/server.js
import './config/bootstrap.js'; // must stay first: creates .env, JWT secret, cwd
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { config } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { ensureSeedUsers } from './scripts/ensureSeed.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// ── Route imports ────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import patientRoutes  from './routes/patientRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// TODO Phase 10: import aiRoutes       from './routes/aiRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../../frontend/dist');
const indexHtml = path.join(distDir, 'index.html');
const hasBuild = fs.existsSync(indexHtml);

const app = express();

// ── Security ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // the kiosk loads fonts/blob previews; CSP would block them
}));

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || origin === config.frontendUrl || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)),
  credentials: true,
}));

// Built frontend (served before rate limiting so page assets never count against it)
if (hasBuild) app.use(express.static(distDir));

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { success: false, message: 'Too many requests. Please wait.' },
}));

// ── Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb', strict: false })); // also tolerate a bare JSON null body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Logging ───────────────────────────────────────────────
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediKiosk API is running',
    version: '1.0.0',
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients',   patientRoutes);
app.use('/api/consents',   consentRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/documents',  documentRoutes);
app.use('/api/doctor',     doctorRoutes);
app.use('/api/admin',      adminRoutes);
// app.use('/api/ai',         aiRoutes);

// ── Single-page app fallback (React routes like /doctor/dashboard) ──
app.use((req, res, next) => {
  if (hasBuild && req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(indexHtml);
  }
  next();
});

// ── 404 + Error handling ──────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
async function start() {
  await connectDB(config.mongoUri);
  await ensureSeedUsers();

  const server = app.listen(config.port, () => {
    console.log('\n🏥 MediKiosk is running');
    console.log(`   Open in browser :  http://localhost:${config.port}${hasBuild ? '' : '   (frontend not built yet: run "npm run build" in /frontend, or use the dev server on :5173)'}`);
    console.log(`   AI summaries    :  ${process.env.AI_API_KEY ? 'Gemini (' + (process.env.AI_MODEL || 'gemini-2.5-flash') + ')' : 'OFF - add AI_API_KEY to backend/.env for real AI summaries'}`);
    console.log('   Doctor login    :  doctor@medikiosk.in / Doctor@1234');
    console.log('   Admin login     :  admin@medikiosk.in / Admin@1234\n');
  });
  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `\n❌ Port ${config.port} is already in use. Close the other MediKiosk window (or change PORT in backend/.env).` : e.message);
    closeDB().finally(() => process.exit(1));
  });

  const shutdown = async () => { server.close(); await closeDB(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
