const mongoose = require('mongoose');

/**
 * Chunk Model — Control Plane Metadata
 *
 * Stores metadata about individual file chunks.
 * NEVER stores actual chunk binary content — that lives on storage nodes.
 */
const chunkSchema = new mongoose.Schema({
  // Unique string identifier for referencing the chunk on storage nodes
  chunkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true,
  },
  // 0-based sequence number; used to reconstruct file in order
  sequence: {
    type: Number,
    required: true,
    min: 0,
  },
  size: {
    // Size of the raw (pre-encryption) chunk in bytes
    type: Number,
    required: true,
    min: 1,
  },
  checksum: {
    // SHA-256 of the raw (pre-encryption) chunk data
    type: String,
    required: true,
  },
  primaryNode: {
    // nodeId of the primary storage node
    type: String,
    required: true,
    index: true,
  },
  replicaNodes: [{
    // nodeIds of replica storage nodes
    type: String,
  }],
  status: {
    type: String,
    enum: ['PENDING', 'WRITING', 'STORED', 'VERIFIED', 'FAILED', 'DEGRADED'],
    default: 'PENDING',
    index: true,
  },
}, {
  timestamps: true,
});

chunkSchema.index({ fileId: 1, sequence: 1 });
chunkSchema.index({ primaryNode: 1, status: 1 });

module.exports = mongoose.model('Chunk', chunkSchema);
