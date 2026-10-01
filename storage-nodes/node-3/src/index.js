const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.STORAGE_PORT || 5003;
const NODE_ID = process.env.STORAGE_NODE_ID || "node-3";
const STORAGE_DIR = process.env.STORAGE_DIR || "./storage";

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

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

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Storage Node ${NODE_ID} running on port ${PORT}`);
  console.log(`Storage directory: ${STORAGE_DIR}`);
});