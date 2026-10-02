const crypto = require('crypto');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const StorageService = require('./StorageService');
const config = require('../config');

/**
 * DownloadCoordinator
 *
 * Orchestrates the complete download pipeline:
 *
 *   Authentication + Authorization (caller's responsibility)
 *     ↓
 *   MongoDB metadata lookup
 *     ↓
 *   Chunk map retrieval
 *     ↓
 *   Node health check → primary or replica selection
 *     ↓
 *   Bounded parallel chunk reads (PARALLEL_DOWNLOADS at a time)
 *     ↓
 *   Per-chunk: checksum verification
 *     ↓
 *   In-sequence reconstruction
 *     ↓
 *   AES decryption
 *     ↓
 *   HTTP streaming response
 *
 * Stage timings are recorded for research analysis.
 */
const DownloadCoordinator = {
  /**
   * Stream a file to the HTTP response.
   *
   * @param {object} opts
   * @param {string} opts.fileId     - File MongoDB ID
   * @param {string} opts.userId     - Authenticated user ID
   * @param {string} opts.requestId  - Audit log correlation ID
   * @param {object} opts.res        - Express response object
   * @returns {Promise<{timings: object}>}
   */
  async download(opts) {
    const { fileId, userId, requestId, res } = opts;
    const timings = {};
    const globalStart = Date.now();

    // ─────────────────────────────────────────
    // METADATA LOOKUP
    // ─────────────────────────────────────────
    const metaStart = Date.now();
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      const err = new Error('File not found');
      err.statusCode = 404;
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    if (file.status === 'UPLOADING' || file.status === 'PROCESSING') {
      const err = new Error('File is not ready for download');
      err.statusCode = 409;
      err.code = 'FILE_NOT_READY';
      throw err;
    }

    const chunks = await Chunk.find({ fileId: file._id }).sort({ sequence: 1 });
    if (chunks.length === 0) {
      const err = new Error('No chunks found for this file');
      err.statusCode = 500;
      err.code = 'CHUNK_NOT_FOUND';
      throw err;
    }
    timings.metadataLookupTime = Date.now() - metaStart;

    // ─────────────────────────────────────────
    // LOAD NODE HEALTH MAP
    // ─────────────────────────────────────────
    const nodeSelStart = Date.now();
    const nodeMap = {};
    const nodeRecords = await StorageNode.find({});
    for (const n of nodeRecords) {
      nodeMap[n.nodeId] = n;
    }
    timings.nodeSelectionTime = Date.now() - nodeSelStart;

    // ─────────────────────────────────────────
    // BOUNDED PARALLEL CHUNK FETCH
    // ─────────────────────────────────────────
    const fetchStart = Date.now();
    const parallelLimit = config.parallelDownloads;
    const chunkBuffers = new Array(chunks.length);

    /**
     * Select the best node for a chunk — primary if healthy, else first healthy replica.
     */
    const selectReadNode = (chunk) => {
      const primary = nodeMap[chunk.primaryNode];
      if (primary && (primary.status === 'HEALTHY' || primary.status === 'DEGRADED')) {
        const url = primary.url || StorageService.getNodeUrl(chunk.primaryNode);
        if (url) return { nodeId: chunk.primaryNode, url };
      }
      // Fallback to replicas
      for (const replicaId of (chunk.replicaNodes || [])) {
        const replica = nodeMap[replicaId];
        if (replica && (replica.status === 'HEALTHY' || replica.status === 'DEGRADED')) {
          const url = replica.url || StorageService.getNodeUrl(replicaId);
          if (url) return { nodeId: replicaId, url };
        }
      }
      return null;
    };

    /**
     * Fetch a single chunk from the best available node.
     */
    const fetchChunk = async (chunk, index) => {
      const readNode = selectReadNode(chunk);
      if (!readNode) {
        throw Object.assign(
          new Error(`No healthy node available for chunk ${chunk.chunkId}`),
          { code: 'NODE_UNAVAILABLE' }
        );
      }

      const data = await StorageService.readChunk(readNode.url, chunk.chunkId);
      chunkBuffers[index] = data;
    };

    // Process in batches of parallelLimit
    for (let i = 0; i < chunks.length; i += parallelLimit) {
      const batch = chunks.slice(i, i + parallelLimit);
      await Promise.all(batch.map((chunk, batchIdx) => fetchChunk(chunk, i + batchIdx)));
    }
    timings.chunkFetchTime = Date.now() - fetchStart;

    // ─────────────────────────────────────────
    // DECRYPT AND RECONSTRUCT
    // ─────────────────────────────────────────
    const decryptStart = Date.now();
    const encryptionKey = Buffer.from(config.encryptionKey.padEnd(32, '0').slice(0, 32));
    const decryptedChunks = [];

    for (let i = 0; i < chunkBuffers.length; i++) {
      const encryptedData = chunkBuffers[i];
      // First 16 bytes are the IV
      const iv = encryptedData.slice(0, 16);
      const ciphertext = encryptedData.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      // Verify chunk checksum (on decrypted/raw data)
      const verifyStart = Date.now();
      const actualChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');
      if (actualChecksum !== chunks[i].checksum) {
        throw Object.assign(
          new Error(`Checksum mismatch for chunk ${chunks[i].chunkId}`),
          { code: 'CHECKSUM_MISMATCH' }
        );
      }
      timings.checksumVerificationTime = (timings.checksumVerificationTime || 0) + (Date.now() - verifyStart);

      decryptedChunks.push(decrypted);
    }
    timings.decryptionTime = Date.now() - decryptStart;

    // Verify full file checksum against original SHA-256
    const reconstructStart = Date.now();
    const fullBuffer = Buffer.concat(decryptedChunks);
    if (file.checksum) {
      const actualFileChecksum = crypto.createHash('sha256').update(fullBuffer).digest('hex');
      if (actualFileChecksum !== file.checksum) {
        throw Object.assign(
          new Error('File integrity check failed — file checksum mismatch'),
          { code: 'CHECKSUM_MISMATCH' }
        );
      }
    }
    timings.reconstructionTime = Date.now() - reconstructStart;

    // ─────────────────────────────────────────
    // STREAM TO CLIENT
    // ─────────────────────────────────────────
    const streamStart = Date.now();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fullBuffer.length);
    res.send(fullBuffer);
    timings.streamTime = Date.now() - streamStart;

    timings.totalDownloadTime = Date.now() - globalStart;

    // Audit log
    await AuditLog.create({
      requestId,
      userId,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      fileId: file._id,
      latencyMs: timings.totalDownloadTime,
      metadata: {
        originalName: file.originalName,
        size: file.size,
        chunkCount: chunks.length,
        timings,
      },
    });

    return { timings };
  },
};

module.exports = DownloadCoordinator;
