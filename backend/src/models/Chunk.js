const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  primaryNode: {
    type: String, // node ID
    required: true
  },
  replicaNodes: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chunk', chunkSchema);
