const crypto = require('crypto');
const zlib = require('zlib');
const { Readable, Transform, PassThrough, pipeline } = require('stream');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const StorageService = require('./StorageService');
const config = require('../config');
const { getFileKey, decryptChunk, sha256 } = require('../utils/encryption');

const DownloadCoordinator = {
  async _prepare(opts) {
    const { fileId, userId } = opts;
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

    if (!['READY', 'DEGRADED'].includes(file.status)) {
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

    let encryptionKey;
    try {
      encryptionKey = getFileKey(file);
    } catch (err) {
      throw Object.assign(
        new Error('File encryption metadata is invalid or the encryption key changed'),
        { code: 'ENCRYPTION_KEY_UNAVAILABLE', statusCode: 500 }
      );
    }

    return { file, chunks, nodeMap, encryptionKey, timings, globalStart };
  },

  async _selectReadNode(chunk, nodeMap) {
    const isReadable = (n) => n && (n.status === 'HEALTHY' || n.status === 'DEGRADED');
    const primary = nodeMap[chunk.primaryNode];
    if (isReadable(primary)) {
      const url = primary.url || await StorageService.getNodeUrlFromDB(chunk.primaryNode) || StorageService.getNodeUrl(chunk.primaryNode);
      if (url) return { nodeId: chunk.primaryNode, url };
    }
    for (const replicaId of (chunk.replicaNodes || [])) {
      const replica = nodeMap[replicaId];
      if (isReadable(replica)) {
        const url = replica.url || await StorageService.getNodeUrlFromDB(replicaId) || StorageService.getNodeUrl(replicaId);
        if (url) return { nodeId: replicaId, url };
      }
    }
    return null;
  },

  /**
   * Stream the decrypted, decompressed file with bounded memory.
   * Chunks are fetched in small parallel batches; at most
   * `parallelDownloads` chunks are buffered at once.
   */
  async downloadStream(opts) {
    const { requestId, runId = null } = opts;
    const { file, chunks, nodeMap, encryptionKey, timings, globalStart } =
      await this._prepare(opts);

    const fetchStart = Date.now();
    const parallelLimit = Math.max(1, config.parallelDownloads || 2);

    const fetchChunk = async (chunk) => {
      const readNode = await this._selectReadNode(chunk, nodeMap);
      if (!readNode) {
        throw Object.assign(
          new Error(`No healthy node available for chunk ${chunk.chunkId}`),
          { code: 'NODE_UNAVAILABLE' }
        );
      }
      const encrypted = await StorageService.readChunk(readNode.url, chunk.chunkId);
      return decryptChunk(encrypted, encryptionKey);
    };

    const source = Readable.from((async function* generate() {
      for (let i = 0; i < chunks.length; i += parallelLimit) {
        const batch = chunks.slice(i, i + parallelLimit);
        const decryptedBatch = await Promise.all(batch.map(fetchChunk));
        for (let j = 0; j < decryptedBatch.length; j++) {
          const decrypted = decryptedBatch[j];
          const chunk = batch[j];
          if (sha256(decrypted) !== chunk.checksum) {
            throw Object.assign(
              new Error(`Checksum mismatch for chunk ${chunk.chunkId}`),
              { code: 'CHECKSUM_MISMATCH' }
            );
          }
          yield decrypted;
        }
      }
    })());

    const shaToVerify = file.originalSha256 || file.checksum;
    const hasher = crypto.createHash('sha256');
    const verifier = new Transform({
      transform(chunkData, enc, callback) {
        hasher.update(chunkData);
        callback(null, chunkData);
      },
      flush(callback) {
        if (shaToVerify && hasher.digest('hex') !== shaToVerify) {
          return callback(Object.assign(
            new Error('File integrity check failed - file checksum mismatch'),
            { code: 'INTEGRITY_CHECK_FAILED' }
          ));
        }
        callback();
      },
    });

    const output = new PassThrough();
    const stages = [source];
    if (file.compressionApplied) {
      stages.push(zlib.createGunzip());
    }
    stages.push(verifier, output);

    const finalName = file.originalFileName || file.originalName || file.filename;
    const contentLength = file.compressionApplied
      ? (file.originalSize || null)
      : (file.storedSize || file.size || null);

    pipeline(...stages, async (err) => {
      timings.chunkFetchTime = Date.now() - fetchStart;
      timings.totalDownloadTime = Date.now() - globalStart;
      try {
        await AuditLog.create({
          requestId,
          userId: opts.userId,
          runId,
          action: 'DOWNLOAD',
          status: err ? 'FAILURE' : 'SUCCESS',
          fileId: file._id,
          reason: err ? err.message : undefined,
          latencyMs: timings.totalDownloadTime,
          metadata: {
            originalName: finalName,
            size: file.originalSize || file.size,
            chunkCount: chunks.length,
            timings,
          },
        });
      } catch (auditErr) {
        console.error('Failed to write download audit log:', auditErr.message);
      }
    });

    return { file, stream: output, contentLength, timings };
  },

  /**
   * Buffered convenience wrapper retained for internal experiment reads.
   * User-facing endpoints should use downloadStream().
   */
  async download(opts) {
    const { file, stream } = await this.downloadStream(opts);
    const parts = [];
    for await (const part of stream) {
      parts.push(Buffer.from(part));
    }
    return { fullBuffer: Buffer.concat(parts), file };
  },
};

module.exports = DownloadCoordinator;
