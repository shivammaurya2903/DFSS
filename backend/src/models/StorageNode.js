const mongoose = require('mongoose');

/**
 * StorageNode Model — Control Plane Metadata
 *
 * Represents a registered logical storage node.
 * Physical data is stored on the HDD at STORAGE_ROOT/nodeId/chunks/.
 *
 * IMPORTANT: All four nodes currently share ONE physical HDD (LOCAL-HDD domain).
 * failureDomainId documents this explicitly for research.
 */
const storageNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  url: {
    // Internal HTTP URL for the node service (e.g., http://localhost:5001)
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HEALTHY', 'DEGRADED', 'OFFLINE', 'FULL', 'RESTRICTED'],
    default: 'OFFLINE',
    index: true,
  },
  // Capacity in bytes
  capacity: {
    type: Number,
    default: 0,
  },
  usedSpace: {
    type: Number,
    default: 0,
  },
  freeSpace: {
    type: Number,
    default: 0,
  },
  // Load factor 0.0 – 1.0 (fraction of capacity in use)
  currentLoad: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  // Round-trip latency in ms (measured or injected)
  latency: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Number of active concurrent requests being served
  activeRequests: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Count of primary chunks on this node
  chunkCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Count of replica chunks on this node
  replicaCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Last successful heartbeat timestamp
  lastHeartbeat: {
    type: Date,
    default: Date.now,
  },

  // ============================================================
  // FAILURE DOMAIN
  // All current nodes share 'LOCAL-HDD'.
  // Future physical deployments can use distinct domain IDs.
  // This does NOT provide real failure isolation in the prototype.
  // ============================================================
  failureDomainId: {
    type: String,
    default: 'LOCAL-HDD',
  },

  // Security capabilities — which sensitivity levels this node can store
  securityCapabilities: {
    type: [String],
    enum: ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
    default: ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
  },

  // Research: simulated/injected conditions (only active in RESEARCH_MODE)
  injectedConditions: {
    active: { type: Boolean, default: false },
    load: { type: Number },
    latency: { type: Number },
    capacity: { type: Number },
    status: { type: String },
    note: { type: String, default: 'SIMULATED — not real hardware measurement' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StorageNode', storageNodeSchema);
