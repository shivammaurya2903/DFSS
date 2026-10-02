const mongoose = require('mongoose');

/**
 * AuditLog Model
 *
 * Immutable audit trail. Never logs passwords, JWTs, or encryption keys.
 * Used for security auditing and research event replay.
 */
const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  requestId: {
    type: String,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null,
  },
  action: {
    type: String,
    enum: [
      'LOGIN', 'LOGOUT', 'REGISTER',
      'UPLOAD', 'DOWNLOAD', 'DELETE',
      'SHARE', 'REVOKE_SHARE',
      'PLACEMENT', 'REPLICA_CREATE',
      'NODE_FAILURE', 'NODE_RECOVERY',
      'REPLICA_REPLACEMENT', 'MIGRATION',
      'RE_EVALUATION',
      'ADMIN_ACTION',
      'EXPERIMENT_START', 'EXPERIMENT_END',
    ],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'IN_PROGRESS'],
    default: 'SUCCESS',
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
    index: true,
  },
  chunkId: {
    type: String,
    default: null,
  },
  nodeId: {
    type: String,
    default: null,
    index: true,
  },
  strategy: {
    type: String,
    default: null,
  },
  latencyMs: {
    type: Number,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
  recoveryAction: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  // Audit logs must not be accidentally updated
  strict: true,
  timestamps: false, // We manage timestamp manually for precision
});

// Compound index for research queries
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
