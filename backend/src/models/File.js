const mongoose = require('mongoose');

/**
 * File Model — Control Plane Metadata
 *
 * Stores metadata about uploaded files.
 * NEVER stores actual file binary content — that lives on storage nodes.
 */
const fileSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    index: true,
    sparse: true,
  },
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  size: {
    type: Number,
    required: true,
    min: 0,
  },
  originalSize: {
    type: Number,
    min: 0,
  },
  storedSize: {
    type: Number,
    min: 0,
  },
  mimeType: {
    type: String,
    required: true,
  },
  originalMimeType: {
    type: String,
  },
  originalFileName: {
    type: String,
  },
  checksum: {
    // SHA-256 of the stored file content
    type: String,
  },
  originalSha256: {
    type: String,
  },
  compressionApplied: {
    type: Boolean,
    default: false,
  },
  compressionAlgorithm: {
    type: String,
  },
  compressionRatio: {
    type: Number,
  },
  spaceSavedBytes: {
    type: Number,
    default: 0,
  },
  encryptionInfo: {
    algorithm: { type: String, default: 'AES-256-CBC' },
    keyId: { type: String }, // identifier for key used; never store the actual key
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  replicationFactor: {
    type: Number,
    default: 2,
  },

  // Security metadata — controls node eligibility in placement
  sensitivity: {
    type: String,
    enum: ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
    default: 'PRIVATE',
  },
  securityClass: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  placementPolicy: {
    type: String,
    enum: ['ROUND_ROBIN', 'PERFORMANCE_AWARE', 'ADAPTIVE'],
    default: 'ADAPTIVE',
  },

  // File state machine
  // UPLOADING → PROCESSING → STORING → REPLICATING → READY
  // Error paths: PROCESSING → FAILED, STORING → FAILED,
  //              REPLICATING → DEGRADED → RECOVERING → READY
  status: {
    type: String,
    enum: ['UPLOADING', 'PROCESSING', 'STORING', 'REPLICATING', 'READY', 'FAILED', 'DEGRADED', 'RECOVERING'],
    default: 'UPLOADING',
    index: true,
  },

  // References to chunk metadata documents
  chunks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chunk',
  }],
}, {
  timestamps: true,
});

fileSchema.index({ owner: 1, status: 1 });
fileSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);
