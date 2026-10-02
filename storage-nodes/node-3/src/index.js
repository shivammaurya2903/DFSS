require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT        = parseInt(process.env.STORAGE_PORT || '5001', 10);
const NODE_ID     = process.env.STORAGE_NODE_ID || 'node-1';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || '';

/**
 * STORAGE_DIR: where chunks are stored on the HDD.
 * Must be set via environment variable (e.g., D:/DistributedStorage/node-1)
 * Falls back to ./storage only in development.
 *
 * NOTE: All four nodes share one physical HDD in this prototype.
 * failureDomainId = 'LOCAL-HDD'
 */
const STORAGE_BASE = process.env.STORAGE_DIR
  || path.join(process.env.STORAGE_ROOT || './storage-data', NODE_ID);

const CHUNKS_DIR = path.join(STORAGE_BASE, 'chunks');
const TEMP_DIR   = path.join(STORAGE_BASE, 'temp');

// Ensure required directories exist
[CHUNKS_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[${NODE_ID}] Created directory: ${dir}`);
  }
});

// Active request counter (for metrics)
let activeRequests = 0;

app.use(express.json());

// ─────────────────────────────────────────
// REQUEST COUNTER MIDDLEWARE
// ─────────────────────────────────────────
app.use((req, res, next) => {
  activeRequests++;
  res.on('finish', () => { activeRequests = Math.max(0, activeRequests - 1); });
  next();
});

// ─────────────────────────────────────────
// CHUNK ID SANITIZATION
// Prevents path traversal attacks.
// chunkId must match safe pattern only.
// ─────────────────────────────────────────
const sanitizeChunkId = (chunkId) => {
  if (!chunkId || !/^[a-zA-Z0-9_\-]+$/.test(chunkId)) {
    return null;
  }
  return chunkId;
};

const safeChunkPath = (chunkId) => {
  const safe = sanitizeChunkId(chunkId);
  if (!safe) return null;
  const resolved = path.resolve(CHUNKS_DIR, safe);
  // Verify the resolved path is still within CHUNKS_DIR
  if (!resolved.startsWith(path.resolve(CHUNKS_DIR))) return null;
  return resolved;
};

// ─────────────────────────────────────────
// MULTER — writes to TEMP_DIR
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const chunkId = req.body?.chunkId || req.headers['x-chunk-id'];
    const safe = sanitizeChunkId(chunkId);
    if (!safe) return cb(new Error('Invalid chunkId'), null);
    cb(null, `tmp_${safe}_${Date.now()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB per chunk
});

// ─────────────────────────────────────────
// STORE CHUNK: POST /internal/chunks
// Safe write pattern: temp → verify → atomic rename
// ─────────────────────────────────────────
app.post('/internal/chunks', upload.single('chunk'), async (req, res) => {
  const rawChunkId = req.body?.chunkId || req.headers['x-chunk-id'];
  const expectedChecksum = req.body?.checksum || req.headers['x-checksum'];

  const chunkId = sanitizeChunkId(rawChunkId);
  if (!chunkId) {
    return res.status(400).json({ error: 'Invalid or missing chunkId' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No chunk data provided' });
  }

  const tempPath   = req.file.path;
  const finalPath  = path.join(CHUNKS_DIR, chunkId);

  try {
    // Verify temp file size matches uploaded size
    const stats = fs.statSync(tempPath);
    if (stats.size !== req.file.size) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'Chunk size mismatch — upload may be corrupt' });
    }

    // Atomic rename: temp → final location
    fs.renameSync(tempPath, finalPath);

    res.status(201).json({ success: true, chunkId, size: stats.size });
  } catch (err) {
    try { fs.unlinkSync(tempPath); } catch (_) { /* ignore */ }
    console.error(`[${NODE_ID}] Write error for chunk ${chunkId}:`, err.message);
    res.status(500).json({ error: 'Failed to store chunk', details: err.message });
  }
});

// ─────────────────────────────────────────
// READ CHUNK: GET /internal/chunks/:chunkId
// ─────────────────────────────────────────
app.get('/internal/chunks/:chunkId', (req, res) => {
  const chunkPath = safeChunkPath(req.params.chunkId);
  if (!chunkPath) {
    return res.status(400).json({ error: 'Invalid chunkId' });
  }
  if (!fs.existsSync(chunkPath)) {
    return res.status(404).json({ error: 'Chunk not found' });
  }
  res.sendFile(chunkPath);
});

// ─────────────────────────────────────────
// CHECK CHUNK EXISTS: HEAD /internal/chunks/:chunkId
// ─────────────────────────────────────────
app.head('/internal/chunks/:chunkId', (req, res) => {
  const chunkPath = safeChunkPath(req.params.chunkId);
  if (!chunkPath) {
    return res.status(400).end();
  }
  if (!fs.existsSync(chunkPath)) {
    return res.status(404).end();
  }
  const stats = fs.statSync(chunkPath);
  res.setHeader('Content-Length', stats.size);
  res.status(200).end();
});

// ─────────────────────────────────────────
// DELETE CHUNK: DELETE /internal/chunks/:chunkId
// ─────────────────────────────────────────
app.delete('/internal/chunks/:chunkId', (req, res) => {
  const chunkPath = safeChunkPath(req.params.chunkId);
  if (!chunkPath) {
    return res.status(400).json({ error: 'Invalid chunkId' });
  }
  if (!fs.existsSync(chunkPath)) {
    return res.status(404).json({ error: 'Chunk not found' });
  }
  try {
    fs.unlinkSync(chunkPath);
    res.json({ success: true, message: 'Chunk deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chunk', details: err.message });
  }
});

// ─────────────────────────────────────────
// HEALTH: GET /internal/health
// ─────────────────────────────────────────
app.get('/internal/health', (req, res) => {
  res.json({
    nodeId: NODE_ID,
    status: 'healthy',
    storageDir: CHUNKS_DIR,
    uptime: process.uptime(),
  });
});

// ─────────────────────────────────────────
// METRICS: GET /internal/metrics
// Returns real storage metrics from the HDD.
// ─────────────────────────────────────────
app.get('/internal/metrics', (req, res) => {
  let totalSpace = 0;
  let availableSpace = 0;
  let chunkCount = 0;

  try {
    // statfsSync for actual disk stats (Node 18+)
    const stats = fs.statfsSync(CHUNKS_DIR);
    totalSpace     = stats.blocks * stats.bsize;
    availableSpace = stats.bavail * stats.bsize;
  } catch (_) {
    // Fallback estimates (not real hardware values)
    totalSpace     = 100 * 1024 * 1024 * 1024; // 100 GB estimate
    availableSpace = 50  * 1024 * 1024 * 1024;  // 50 GB estimate
  }

  try {
    const files = fs.readdirSync(CHUNKS_DIR);
    chunkCount = files.length;
  } catch (_) {}

  res.json({
    nodeId: NODE_ID,
    totalSpace,
    availableSpace,
    usedSpace: totalSpace - availableSpace,
    utilizationPercent: totalSpace > 0
      ? (((totalSpace - availableSpace) / totalSpace) * 100).toFixed(2)
      : 0,
    chunkCount,
    activeRequests,
    storageDir: CHUNKS_DIR,
    // Physical disclaimer: all nodes share one HDD
    failureDomainId: 'LOCAL-HDD',
    physicalNote: 'PROTOTYPE: all nodes share one physical HDD',
  });
});

// ─────────────────────────────────────────
// HEARTBEAT TO BACKEND
// Reports real metrics to the backend on schedule.
// ─────────────────────────────────────────
const sendHeartbeat = async () => {
  try {
    let totalSpace = 100 * 1024 * 1024 * 1024;
    let availableSpace = 50 * 1024 * 1024 * 1024;

    try {
      const stats = fs.statfsSync(CHUNKS_DIR);
      totalSpace     = stats.blocks * stats.bsize;
      availableSpace = stats.bavail * stats.bsize;
    } catch (_) { /* use fallback */ }

    let chunkCount = 0;
    try {
      chunkCount = fs.readdirSync(CHUNKS_DIR).length;
    } catch (_) {}

    const usedSpace = totalSpace - availableSpace;
    const currentLoad = totalSpace > 0 ? usedSpace / totalSpace : 0;

    await axios.post(
      `${BACKEND_URL}/api/storage/heartbeat`,
      {
        nodeId: NODE_ID,
        totalSpace,
        availableSpace,
        usedSpace,
        currentLoad,
        activeRequests,
        chunkCount,
        latency: 0,
      },
      {
        headers: { 'x-internal-token': INTERNAL_SECRET },
        timeout: 5000,
      }
    );
  } catch (err) {
    console.error(`[${NODE_ID}] Heartbeat failed: ${err.message}`);
  }
};

// Initial registration
const registerWithBackend = async () => {
  try {
    let totalSpace = 100 * 1024 * 1024 * 1024;
    try {
      const stats = fs.statfsSync(CHUNKS_DIR);
      totalSpace = stats.blocks * stats.bsize;
    } catch (_) {}

    await axios.post(
      `${BACKEND_URL}/api/storage/register`,
      {
        nodeId: NODE_ID,
        url: `http://${process.env.NODE_HOST || 'localhost'}:${PORT}`,
        capacity: totalSpace,
        failureDomainId: 'LOCAL-HDD',
        securityCapabilities: ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
      },
      {
        headers: { 'x-internal-token': INTERNAL_SECRET },
        timeout: 5000,
      }
    );
    console.log(`[${NODE_ID}] Registered with backend at ${BACKEND_URL}`);
  } catch (err) {
    console.warn(`[${NODE_ID}] Registration failed (will retry on next heartbeat): ${err.message}`);
  }
};

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[${NODE_ID}] Storage node running on port ${PORT}`);
  console.log(`[${NODE_ID}] Chunks directory: ${CHUNKS_DIR}`);
  console.log(`[${NODE_ID}] Temp directory:   ${TEMP_DIR}`);
  console.log(`[${NODE_ID}] Backend URL:      ${BACKEND_URL}`);

  // Register with backend on startup
  await registerWithBackend();

  // Start heartbeat
  const heartbeatIntervalMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '5000', 10);
  setInterval(sendHeartbeat, heartbeatIntervalMs);
  console.log(`[${NODE_ID}] Heartbeat interval: ${heartbeatIntervalMs}ms`);
});