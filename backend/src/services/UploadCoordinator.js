const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const AuditLog = require('../models/AuditLog');
const StorageService = require('./StorageService');
const PlacementPolicyManager = require('../placement/PlacementPolicyManager');
const config = require('../config');

/**
 * UploadCoordinator
 *
 * Orchestrates the complete upload pipeline:
 *
 *   Authentication (caller's responsibility, via middleware)
 *     ↓
 *   Validation
 *     ↓
 *   Create fileId
 *     ↓
 *   Read file from disk (temp file from multer)
 *     ↓
 *   Compute original SHA-256 (BEFORE encryption)
 *     ↓
 *   Chunking
 *     ↓
 *   Per-chunk: SHA-256 → AES encrypt → Placement → Primary write → Replica write
 *     ↓
 *   Metadata commit
 *     ↓
 *   READY
 *
 * Stage timings are recorded for research analysis.
 */
const UploadCoordinator = {
  /**
   * Execute the upload pipeline.
   *
   * @param {object} opts
   * @param {object} opts.fileData     - Multer file object (disk storage)
   * @param {string} opts.userId       - Authenticated user ID
   * @param {string} opts.requestId    - Request ID for audit log correlation
   * @param {string} [opts.sensitivity]
   * @param {string} [opts.securityClass]
   * @param {string} [opts.placementPolicy]
   * @param {string} [opts.runId]      - Research run ID
   * @param {string} [opts.scenarioId]
   * @returns {Promise<{file: File, timings: object}>}
   */
  async upload(opts) {
    const {
      fileData,
      userId,
      requestId,
      sensitivity = 'PRIVATE',
      securityClass = 'MEDIUM',
      placementPolicy = 'ADAPTIVE',
      runId = null,
      scenarioId = null,
    } = opts;

    console.log('[DEBUG] UploadCoordinator.upload opts:', { userId, originalname: fileData?.originalname });

    const timings = {};
    const globalStart = Date.now();

    // ─────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────
    const validationStart = Date.now();
    if (!fileData) throw Object.assign(new Error('No file provided'), { code: 'INVALID_FILE' });
    if (fileData.size > 10 * 1024 * 1024 * 1024) { // 10 GB max
      throw Object.assign(new Error('File exceeds maximum size of 10 GB'), { code: 'FILE_TOO_LARGE' });
    }
    timings.validationTime = Date.now() - validationStart;

    // ─────────────────────────────────────────
    // CREATE FILE RECORD (status: UPLOADING)
    // ─────────────────────────────────────────
    const uploadId = crypto.randomUUID();
    const fileDoc = await File.create({
      uploadId,
      filename: fileData.originalname,
      originalName: fileData.originalname,
      owner: userId,
      size: fileData.size,
      mimeType: fileData.mimetype,
      sensitivity,
      securityClass,
      placementPolicy,
      replicationFactor: config.replicationFactor,
      status: 'UPLOADING',
    });

    try {
      // ─────────────────────────────────────────
      // COMPUTE ORIGINAL FILE SHA-256 (pre-encryption)
      // ─────────────────────────────────────────
      const checksumStart = Date.now();
      const fileBuffer = fs.readFileSync(fileData.path);
      const originalChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      timings.checksumTime = Date.now() - checksumStart;

      await File.findByIdAndUpdate(fileDoc._id, {
        checksum: originalChecksum,
        status: 'PROCESSING',
      });

      // ─────────────────────────────────────────
      // CHUNKING + ENCRYPTION + PLACEMENT
      // ─────────────────────────────────────────
      const chunkingStart = Date.now();
      const chunkSize = config.chunkSizeBytes;
      const totalChunks = Math.ceil(fileBuffer.length / chunkSize);
      const encryptionKey = Buffer.from(config.encryptionKey.padEnd(32, '0').slice(0, 32));

      await File.findByIdAndUpdate(fileDoc._id, {
        chunkCount: totalChunks,
        status: 'STORING',
      });
      timings.chunkingSetupTime = Date.now() - chunkingStart;

      const chunkDocs = [];
      let totalPlacementTimeMs = 0;
      let totalPrimaryWriteMs = 0;
      let totalReplicaWriteMs = 0;
      const encryptionTimes = [];

      for (let i = 0; i < totalChunks; i++) {
        const rawChunk = fileBuffer.slice(i * chunkSize, (i + 1) * chunkSize);

        // Chunk SHA-256 (on raw/unencrypted data)
        const chunkChecksum = crypto.createHash('sha256').update(rawChunk).digest('hex');

        // AES-256-CBC encryption
        const encStart = Date.now();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        const encryptedChunk = Buffer.concat([iv, cipher.update(rawChunk), cipher.final()]);
        encryptionTimes.push(Date.now() - encStart);

        // Generate unique chunk ID: fileId_sequenceIndex
        const chunkId = `${fileDoc._id}_${i}`;

        // Placement
        const placementStart = Date.now();
        const placement = await PlacementPolicyManager.place({
          file: fileDoc,
          chunkId,
          chunkSize: rawChunk.length,
          replicationFactor: config.replicationFactor,
          runId,
          scenarioId,
        });
        totalPlacementTimeMs += Date.now() - placementStart;

        const primaryNode = placement.primary;
        const replicaNodes = placement.replicas;

        // Primary write
        const primaryUrl = primaryNode.url || StorageService.getNodeUrl(primaryNode.nodeId);
        const pWriteStart = Date.now();
        await StorageService.writeChunk(primaryUrl, chunkId, encryptedChunk, chunkChecksum);
        totalPrimaryWriteMs += Date.now() - pWriteStart;

        // Replica writes
        const rWriteStart = Date.now();
        await File.findByIdAndUpdate(fileDoc._id, { status: 'REPLICATING' });
        for (const replicaNode of replicaNodes) {
          const replicaUrl = replicaNode.url || StorageService.getNodeUrl(replicaNode.nodeId);
          await StorageService.writeChunk(replicaUrl, chunkId, encryptedChunk, chunkChecksum);
        }
        totalReplicaWriteMs += Date.now() - rWriteStart;

        // Create chunk metadata record
        const chunkDoc = await Chunk.create({
          chunkId,
          fileId: fileDoc._id,
          sequence: i,
          size: rawChunk.length,
          checksum: chunkChecksum,
          primaryNode: primaryNode.nodeId,
          replicaNodes: replicaNodes.map(n => n.nodeId),
          status: 'VERIFIED',
        });

        chunkDocs.push(chunkDoc._id);
      }

      timings.encryptionTime = encryptionTimes.reduce((a, b) => a + b, 0);
      timings.placementTime = totalPlacementTimeMs;
      timings.primaryWriteTime = totalPrimaryWriteMs;
      timings.replicaWriteTime = totalReplicaWriteMs;

      // ─────────────────────────────────────────
      // METADATA COMMIT
      // ─────────────────────────────────────────
      const metaStart = Date.now();
      const finalFile = await File.findByIdAndUpdate(
        fileDoc._id,
        {
          chunks: chunkDocs,
          chunkCount: chunkDocs.length,
          status: 'READY',
        },
        { new: true }
      );
      timings.metadataCommitTime = Date.now() - metaStart;

      // Cleanup temp file
      try { fs.unlinkSync(fileData.path); } catch (_) { /* ignore */ }

      timings.totalUploadTime = Date.now() - globalStart;

      // Audit log
      await AuditLog.create({
        requestId,
        userId,
        action: 'UPLOAD',
        status: 'SUCCESS',
        fileId: finalFile._id,
        latencyMs: timings.totalUploadTime,
        metadata: {
          originalName: fileData.originalname,
          size: fileData.size,
          chunkCount: chunkDocs.length,
          placementPolicy,
          timings,
        },
      });

      return { file: finalFile, timings };

    } catch (err) {
      // Mark file as FAILED
      await File.findByIdAndUpdate(fileDoc._id, { status: 'FAILED' });

      // Cleanup temp file if still exists
      try {
        if (fileData.path) fs.unlinkSync(fileData.path);
      } catch (_) { /* ignore */ }

      // Audit log failure
      await AuditLog.create({
        requestId,
        userId,
        action: 'UPLOAD',
        status: 'FAILURE',
        fileId: fileDoc._id,
        reason: err.message,
        metadata: { originalName: fileData.originalname },
      });

      throw err;
    }
  },
};

module.exports = UploadCoordinator;
