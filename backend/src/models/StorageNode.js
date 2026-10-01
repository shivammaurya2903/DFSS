const mongoose = require('mongoose');

const storageNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['HEALTHY', 'DEGRADED', 'OFFLINE', 'FULL', 'RESTRICTED'],
    default: 'OFFLINE'
  },
  capacity: {
    type: Number,
    default: 0
  },
  usedSpace: {
    type: Number,
    default: 0
  },
  freeSpace: {
    type: Number,
    default: 0
  },
  currentLoad: {
    type: Number,
    default: 0
  },
  latency: {
    type: Number,
    default: 0
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('StorageNode', storageNodeSchema);
