const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ShareToken Model
 *
 * Represents a file share grant with an expiry and revocation mechanism.
 * The actual token is hashed before storage — never stored plaintext.
 */
const shareTokenSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // SHA-256 hash of the actual token (token is given to recipient, hash stored here)
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  permission: {
    type: String,
    enum: ['viewer', 'editor', 'owner'],
    default: 'viewer',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  sharedWithEmail: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

/**
 * Generate a new random token and return both the plaintext (to send to recipient)
 * and the hash (to store in DB).
 */
shareTokenSchema.statics.generateToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

/**
 * Hash a received plaintext token for lookup.
 */
shareTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Check if this share token is currently valid.
 */
shareTokenSchema.methods.isValid = function () {
  if (this.revokedAt) return false;
  if (new Date() > this.expiresAt) return false;
  return true;
};

module.exports = mongoose.model('ShareToken', shareTokenSchema);
