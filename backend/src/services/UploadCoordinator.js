const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const StorageService = require('./StorageService');
const PlacementPolicyManager = require('../placement/PlacementPolicyManager');
const config = require('../config');
const { isPotentiallyCompressible, compressFile } = require('../utils/compression');
const { buildEncryptionInfo, encryptChunk, sha256 } = require('../utils/encryption');

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * UploadCoordinator
 */
const UploadCoordinator = {
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

    const timings = {};
    const globalStart = Date.now();

    const validationStart = Date.now();
    if (!fileData) throw Object.assign(new Error('No file provided'), { code: 'INVALID_FILE', statusCode: 400 });
    timings.validationTime = Date.now() - validationStart;

    const uploadId = crypto.randomUUID();

    // ─────────────────────────────────────────
    // COMPUTE ORIGINAL FILE SHA-256 (pre-encryption)
    // ─────────────────────────────────────────
    const checksumStart = Date.now();
    const originalChecksum = await hashFile(fileData.path);
    const originalSize = fileData.size;
    timings.checksumTime = Date.now() - checksumStart;

    // ─────────────────────────────────────────
    // ORIGINAL FILE SIZE VALIDATION
    // ─────────────────────────────────────────
    const maxOriginalSize = config.maxOriginalFileSize || 500 * 1024 * 1024; // 500 MB default
    if (originalSize > maxOriginalSize) {
      try { fs.unlinkSync(fileData.path); } catch (_) {}
      throw Object.assign(new Error(`File exceeds maximum allowed original size of ${maxOriginalSize / (1024*1024)} MB.`), { code: 'ORIGINAL_FILE_LIMIT_EXCEEDED', statusCode: 413 });
    }

    // ─────────────────────────────────────────
    // COMPRESSION
    // ─────────────────────────────────────────
    let storedSize = originalSize;
    let compressionApplied = false;
    let tempCompressedPath = null;
    let uploadPath = fileData.path;
    const compressionStart = Date.now();

    if (isPotentiallyCompressible(fileData.mimetype, fileData.originalname)) {
      tempCompressedPath = fileData.path + '.gz';
      await compressFile(fileData.path, tempCompressedPath);
      const compressedSize = fs.statSync(tempCompressedPath).size;
      
      if (compressedSize < originalSize) {
        compressionApplied = true;
        storedSize = compressedSize;
        uploadPath = tempCompressedPath;
      }
    }
    timings.compressionTime = Date.now() - compressionStart;

    // ─────────────────────────────────────────
    // POST-COMPRESSION VALIDATION
    // ─────────────────────────────────────────
    const maxStoredSize = config.maxStoredFileSize || maxOriginalSize;
    if (storedSize > maxStoredSize) {
      if (tempCompressedPath) try { fs.unlinkSync(tempCompressedPath); } catch (_) {}
      try { fs.unlinkSync(fileData.path); } catch (_) {}
      throw Object.assign(new Error(`File exceeds the ${maxStoredSize / (1024*1024)} MB stored-size limit.`), { code: 'STORED_FILE_LIMIT_EXCEEDED', statusCode: 413 });
    }

    // ─────────────────────────────────────────
    // QUOTA RESERVATION
    // ─────────────────────────────────────────
    const user = await User.findOneAndUpdate(
      { _id: userId, $expr: { $lte: [ { $add: [{ $ifNull: ["$usedStorage", 0] }, { $ifNull: ["$reservedStorage", 0] }, storedSize] }, { $ifNull: ["$storageQuota", config.defaultStorageQuota] } ] } },
      { $inc: { reservedStorage: storedSize } },
      { returnDocument: 'after' }
    );
    if (!user) {
      if (tempCompressedPath) try { fs.unlinkSync(tempCompressedPath); } catch (_) {}
      try { fs.unlinkSync(fileData.path); } catch (_) {}
      throw Object.assign(new Error('Not enough storage quota.'), { code: 'USER_STORAGE_QUOTA_EXCEEDED', statusCode: 507 });
    }

    let fileDoc;
    let chunkDocs = [];
    let totalPlacementTimeMs = 0;
    let totalPrimaryWriteMs = 0;
    let totalReplicaWriteMs = 0;
    let physicalChunksWritten = [];
    let encryptionTimes = [];
    try {
      // ─────────────────────────────────────────
      // CREATE FILE RECORD (status: PROCESSING)
      // ─────────────────────────────────────────
      fileDoc = await File.create({
        uploadId,
        filename: fileData.originalname,
        originalName: fileData.originalname,
        owner: userId,
        size: storedSize, 
        originalSize,
        storedSize,
        mimeType: fileData.mimetype,
        originalMimeType: fileData.mimetype,
        originalFileName: fileData.originalname,
        checksum: originalChecksum,
        originalSha256: originalChecksum,
        compressionApplied,
        compressionAlgorithm: compressionApplied ? 'gzip' : null,
        compressionRatio: compressionApplied ? storedSize / originalSize : 1,
        spaceSavedBytes: originalSize - storedSize,
        sensitivity,
        securityClass,
        placementPolicy,
        replicationFactor: config.replicationFactor,
        status: 'PROCESSING',
      });
      // ─────────────────────────────────────────
      // CHUNKING + ENCRYPTION + PLACEMENT
      // ─────────────────────────────────────────
      const chunkingStart = Date.now();
      const chunkSize = config.chunkSizeBytes;
      const totalChunks = Math.ceil(storedSize / chunkSize);
      const { dataKey: encryptionKey, encryptionInfo } = buildEncryptionInfo();
      await File.findByIdAndUpdate(fileDoc._id, { encryptionInfo });

      await File.findByIdAndUpdate(fileDoc._id, {
        chunkCount: totalChunks,
        status: 'STORING',
      });
      timings.chunkingSetupTime = Date.now() - chunkingStart;

      const sourceFd = fs.openSync(uploadPath, 'r');
      try {
        for (let i = 0; i < totalChunks; i++) {
          const offset = i * chunkSize;
          const length = Math.min(chunkSize, storedSize - offset);
          const rawChunk = Buffer.allocUnsafe(length);
          const bytesRead = fs.readSync(sourceFd, rawChunk, 0, length, offset);
          if (bytesRead !== length) {
            throw Object.assign(new Error(`Short read while chunking upload (${bytesRead}/${length})`), {
              code: 'UPLOAD_READ_FAILED',
              statusCode: 500,
            });
          }

          const chunkChecksum = sha256(rawChunk);

          const encStart = Date.now();
          const encryptedChunk = encryptChunk(rawChunk, encryptionKey);
          const encryptedChecksum = sha256(encryptedChunk);
          encryptionTimes.push(Date.now() - encStart);

          const chunkId = `${fileDoc._id}_${i}`;

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

          const primaryUrl = primaryNode.url || await StorageService.getNodeUrlFromDB(primaryNode.nodeId) || StorageService.getNodeUrl(primaryNode.nodeId);
          const pWriteStart = Date.now();
          await StorageService.writeChunk(primaryUrl, chunkId, encryptedChunk, encryptedChecksum);
          physicalChunksWritten.push({ url: primaryUrl, chunkId });
          totalPrimaryWriteMs += Date.now() - pWriteStart;

          const rWriteStart = Date.now();
          await File.findByIdAndUpdate(fileDoc._id, { status: 'REPLICATING' });
          for (const replicaNode of replicaNodes) {
            const replicaUrl = replicaNode.url || await StorageService.getNodeUrlFromDB(replicaNode.nodeId) || StorageService.getNodeUrl(replicaNode.nodeId);
            await StorageService.writeChunk(replicaUrl, chunkId, encryptedChunk, encryptedChecksum);
            physicalChunksWritten.push({ url: replicaUrl, chunkId });
          }
          totalReplicaWriteMs += Date.now() - rWriteStart;

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
      } finally {
        fs.closeSync(sourceFd);
      }

      timings.encryptionTime = encryptionTimes.reduce((a, b) => a + b, 0);
      timings.placementTime = totalPlacementTimeMs;
      timings.primaryWriteTime = totalPrimaryWriteMs;
      timings.replicaWriteTime = totalReplicaWriteMs;

      // ─────────────────────────────────────────
      // METADATA & QUOTA COMMIT
      // ─────────────────────────────────────────
      const metaStart = Date.now();
      const finalFile = await File.findByIdAndUpdate(
        fileDoc._id,
        {
          chunks: chunkDocs,
          chunkCount: chunkDocs.length,
          status: 'READY',
        },
        { returnDocument: 'after' }
      );
      
      // Commit Quota
      await User.findByIdAndUpdate(userId, { $inc: { reservedStorage: -storedSize, usedStorage: storedSize } });
      
      timings.metadataCommitTime = Date.now() - metaStart;

      try { fs.unlinkSync(fileData.path); } catch (_) {}
      if (tempCompressedPath) try { fs.unlinkSync(tempCompressedPath); } catch (_) {}

      timings.totalUploadTime = Date.now() - globalStart;

      await AuditLog.create({
        requestId,
        userId,
        action: 'UPLOAD',
        status: 'SUCCESS',
        fileId: finalFile._id,
        runId,
        scenarioId,
        latencyMs: timings.totalUploadTime,
        metadata: {
          originalName: fileData.originalname,
          size: storedSize,
          chunkCount: chunkDocs.length,
          placementPolicy,
          timings,
        },
      });

      return { file: finalFile, timings };

    } catch (err) {
      if (fileDoc) {
        await File.findByIdAndUpdate(fileDoc._id, { status: 'FAILED' });
      }

      // Release Quota
      await User.findByIdAndUpdate(userId, { $inc: { reservedStorage: -storedSize } });

      // Clean up orphaned physical chunks
      if (physicalChunksWritten.length > 0) {
        for (const { url, chunkId } of physicalChunksWritten) {
          try {
            await StorageService.deleteChunk(url, chunkId);
          } catch (cleanupErr) {
            console.error(`Failed to cleanup chunk ${chunkId} from ${url}:`, cleanupErr.message);
          }
        }
      }

      try { if (fileData.path) fs.unlinkSync(fileData.path); } catch (_) {}
      if (tempCompressedPath) try { fs.unlinkSync(tempCompressedPath); } catch (_) {}

      await AuditLog.create({
        requestId,
        userId,
        action: 'UPLOAD',
        status: 'FAILURE',
        fileId: fileDoc ? fileDoc._id : null,
        runId,
        scenarioId,
        reason: err.message,
        metadata: { originalName: fileData.originalname },
      });

      throw err;
    }
  },
};

module.exports = UploadCoordinator;
