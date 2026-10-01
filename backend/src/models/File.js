const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['UPLOADING', 'READY', 'FAILED'],
    default: 'UPLOADING'
  },
  checksum: {
    type: String
  },
  chunks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chunk'
  }]
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
