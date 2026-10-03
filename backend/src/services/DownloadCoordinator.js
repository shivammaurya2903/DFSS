const crypto = require('crypto');
const zlib = require('zlib');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const StorageService = require('./StorageService');
const config = require('../config');

const DownloadCoordinator = {
  async download(opts) {
    const { fileId, userId, requestId, res } = opts;
    const timings = {};
    const globalStart = Date.now();

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

    const nodeSelStart = Date.now();
    const nodeMap = {};
    const nodeRecords = await StorageNode.find({});
    for (const n of nodeRecords) {
      nodeMap[n.nodeId] = n;
    }
    timings.nodeSelectionTime = Date.now() - nodeSelStart;

    const fetchStart = Date.now();
    const parallelLimit = config.parallelDownloads;
    const chunkBuffers = new Array(chunks.length);

    const selectReadNode = async (chunk) => {
      const primary = nodeMap[chunk.primaryNode];
      if (primary && (primary.status === 'HEALTHY' || primary.status === 'DEGRADED')) {
        const url = primary.url || await StorageService.getNodeUrlFromDB(chunk.primaryNode) || StorageService.getNodeUrl(chunk.primaryNode);
        if (url) return { nodeId: chunk.primaryNode, url };
      }
      for (const replicaId of (chunk.replicaNodes || [])) {
        const replica = nodeMap[replicaId];
        if (replica && (replica.status === 'HEALTHY' || replica.status === 'DEGRADED')) {
          const url = replica.url || await StorageService.getNodeUrlFromDB(replicaId) || StorageService.getNodeUrl(replicaId);
          if (url) return { nodeId: replicaId, url };
        }
      }
      return null;
    };

    const fetchChunk = async (chunk, index) => {
      const readNode = await selectReadNode(chunk);
      if (!readNode) {
        throw Object.assign(
          new Error(`No healthy node available for chunk ${chunk.chunkId}`),
          { code: 'NODE_UNAVAILABLE' }
        );
      }

      const data = await StorageService.readChunk(readNode.url, chunk.chunkId);
      chunkBuffers[index] = data;
    };

    for (let i = 0; i < chunks.length; i += parallelLimit) {
      const batch = chunks.slice(i, i + parallelLimit);
      await Promise.all(batch.map((chunk, batchIdx) => fetchChunk(chunk, i + batchIdx)));
    }
    timings.chunkFetchTime = Date.now() - fetchStart;

    const decryptStart = Date.now();
    const encryptionKey = Buffer.from(config.encryptionKey.padEnd(32, '0').slice(0, 32));
    const decryptedChunks = [];

    for (let i = 0; i < chunkBuffers.length; i++) {
      const encryptedData = chunkBuffers[i];
      const iv = encryptedData.slice(0, 16);
      const ciphertext = encryptedData.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

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

    const reconstructStart = Date.now();
    let fullBuffer = Buffer.concat(decryptedChunks);

    if (file.compressionApplied) {
      try {
        fullBuffer = zlib.unzipSync(fullBuffer);
      } catch (err) {
        throw Object.assign(
          new Error('File decompression failed'),
          { code: 'DECOMPRESSION_FAILED' }
        );
      }
    }

    const shaToVerify = file.originalSha256 || file.checksum;
    if (shaToVerify) {
      const actualFileChecksum = crypto.createHash('sha256').update(fullBuffer).digest('hex');
      if (actualFileChecksum !== shaToVerify) {
        throw Object.assign(
          new Error('File integrity check failed — file checksum mismatch'),
          { code: 'INTEGRITY_CHECK_FAILED' }
        );
      }
    }
    timings.reconstructionTime = Date.now() - reconstructStart;

    timings.totalDownloadTime = Date.now() - globalStart;
    
    const finalName = file.originalFileName || file.originalName || file.filename;

    await AuditLog.create({
      requestId,
      userId,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      fileId: file._id,
      latencyMs: timings.totalDownloadTime,
      metadata: {
        originalName: finalName,
        size: file.originalSize || file.size,
        chunkCount: chunks.length,
        timings,
      },
    });

    return { fullBuffer, file, timings };
  },
};

module.exports = DownloadCoordinator;
