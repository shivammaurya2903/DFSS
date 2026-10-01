require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();
const PORT = process.env.STORAGE_PORT || 5001;
const NODE_ID = process.env.STORAGE_NODE_ID || "node-1";
const STORAGE_DIR = process.env.STORAGE_DIR || "./storage";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:5000";

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Multer config for binary chunk uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_DIR);
  },
  filename: function (req, file, cb) {
    // Expected to receive chunk ID in the body or use the provided filename
    const chunkId = req.body.chunkId || file.originalname;
    cb(null, chunkId);
  }
});
const upload = multer({ storage: storage });

app.use(express.json());

// Heartbeat mechanism
setInterval(async () => {
  try {
    // Gather stats (e.g., free space, could be simulated or use native fs module)
    let availableSpace = 0;
    let totalSpace = 0;
    try {
        const stats = fs.statfsSync(STORAGE_DIR);
        availableSpace = stats.bavail * stats.bsize;
        totalSpace = stats.blocks * stats.bsize;
    } catch(err) {
        // Fallback if statfsSync is not supported
        availableSpace = 1024 * 1024 * 1024 * 10; // 10GB
        totalSpace = 1024 * 1024 * 1024 * 100; // 100GB
    }

    await axios.post(`${BACKEND_URL}/api/internal/heartbeat`, {
      nodeId: NODE_ID,
      status: "healthy",
      port: PORT,
      availableSpace,
      totalSpace
    });
  } catch (error) {
    console.error(`Heartbeat failed: ${error.message}`);
  }
}, 30000); // 30 seconds

// Store chunk
app.post("/chunks", upload.single('chunk'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No chunk file provided" });
  }
  res.status(201).json({ message: "Chunk stored successfully", chunkId: req.file.filename });
});

// Retrieve chunk
app.get("/chunks/:chunkId", (req, res) => {
  const chunkPath = path.join(STORAGE_DIR, req.params.chunkId);
  if (!fs.existsSync(chunkPath)) {
    return res.status(404).json({ error: "Chunk not found" });
  }
  res.sendFile(path.resolve(chunkPath));
});

// Delete chunk
app.delete("/chunks/:chunkId", (req, res) => {
  const chunkPath = path.join(STORAGE_DIR, req.params.chunkId);
  if (!fs.existsSync(chunkPath)) {
    return res.status(404).json({ error: "Chunk not found" });
  }
  try {
    fs.unlinkSync(chunkPath);
    res.json({ message: "Chunk deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete chunk", details: error.message });
  }
});

app.get("/internal/health", (req, res) => {
  res.json({
    nodeId: NODE_ID,
    status: "healthy",
  });
});

app.get("/internal/storage-dir", (req, res) => {
  res.json({
    nodeId: NODE_ID,
    storageDirectory: STORAGE_DIR,
  });
});

app.listen(PORT, () => {
  console.log(`Storage Node ${NODE_ID} running on port ${PORT}`);
  console.log(`Storage directory: ${STORAGE_DIR}`);
});