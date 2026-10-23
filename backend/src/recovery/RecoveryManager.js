const Chunk = require('../models/Chunk');
const File = require('../models/File');
const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const StorageService = require('../services/StorageService');
const { getFileKey, decryptChunk, sha256 } = require('../utils/encryption');

/**
 * RecoveryManager
 *
 * Handles failure recovery when a storage node goes OFFLINE.
 *
 * Checksum contract:
 *   - Chunk.checksum is the SHA-256 of the plaintext (compressed file) chunk.
 *   - Storage nodes verify the SHA-256 of the bytes they receive, which are
 *     encrypted. The write call must therefore use the encrypted payload hash.
 */
const RecoveryManager = {
  /**
   * Handle a node failure event.
   * Called by HeartbeatMonitor when a node is detected OFFLINE.
   *
   * @param {string} failedNodeId
   */
  async handleNodeFailure(failedNodeId) {
    const recoveryStart = Date.now();
    console.log(`[RecoveryManager] Starting recovery for failed node: ${failedNodeId}`);

    const affectedChunks = await Chunk.find({
      $or: [
        { primaryNode: failedNodeId },
        { replicaNodes: failedNodeId },
      ],
      status: { $nin: ['FAILED'] },
    });

    if (affectedChunks.length === 0) {
      console.log(`[RecoveryManager] No affected chunks for node ${failedNodeId}`);
      return { affectedChunks: 0, recoveredCount: 0, degradedCount: 0, failedCount: 0 };
    }

    console.log(`[RecoveryManager] ${affectedChunks.length} chunk(s) affected by ${failedNodeId}`);

    const affectedFileIds = [...new Set(affectedChunks.map(c => c.fileId.toString()))];
    await File.updateMany(
      { _id: { $in: affectedFileIds }, status: { $in: ['READY', 'DEGRADED'] } },
      { status: 'RECOVERING' }
    );

    let recoveredCount = 0;
    let degradedCount = 0;
    let failedCount = 0;
    let totalBytesRecovered = 0;

    for (const chunk of affectedChunks) {
      try {
        const result = await this._recoverChunk(chunk, failedNodeId);
        if (result.replaced) {
          recoveredCount++;
          totalBytesRecovered += chunk.size || 0;
        } else {
          degradedCount++;
        }
      } catch (err) {
        failedCount++;
        console.error(
          `[RecoveryManager] Failed to recover chunk ${chunk.chunkId}: ${err.message}`
        );
        await Chunk.findByIdAndUpdate(chunk._id, { status: 'FAILED' });
      }
    }

    for (const fileId of affectedFileIds) {
      const unverifiedChunks = await Chunk.countDocuments({
        fileId,
        status: { $ne: 'VERIFIED' },
      });
      await File.findByIdAndUpdate(fileId, {
        status: unverifiedChunks === 0 ? 'READY' : 'DEGRADED',
      });
    }

    const recoveryTimeMs = Date.now() - recoveryStart;

    await AuditLog.create({
      action: 'NODE_RECOVERY',
      status: failedCount === 0 && degradedCount === 0 ? 'SUCCESS' : 'FAILURE',
      nodeId: failedNodeId,
      latencyMs: recoveryTimeMs,
      metadata: {
        affectedChunks: affectedChunks.length,
        recoveredCount,
        degradedCount,
        failedCount,
        totalBytesRecovered,
        recoveryTimeMs,
        simulated: false,
      },
    }).catch(() => {});

    console.log(
      `[RecoveryManager] Recovery complete for ${failedNodeId}: ` +
      `${recoveredCount} recovered, ${degradedCount} degraded, ${failedCount} failed. ` +
      `Time: ${recoveryTimeMs}ms`
    );

    return {
      affectedChunks: affectedChunks.length,
      recoveredCount,
      degradedCount,
      failedCount,
      recoveryTimeMs,
    };
  },

  /**
   * Recover a single chunk after its node failed.
   * @returns {Promise<{replaced: boolean}>}
   */
  async _recoverChunk(chunk, failedNodeId) {
    const sourceNodeId = await this._findHealthySource(chunk, failedNodeId);
    if (!sourceNodeId) {
      throw new Error(`No healthy source for chunk ${chunk.chunkId}`);
    }

    const file = await File.findById(chunk.fileId);
    if (!file) {
      throw new Error(`File metadata not found for chunk ${chunk.chunkId}`);
    }

    const sourceNode = await StorageNode.findOne({ nodeId: sourceNodeId });
    const sourceUrl = sourceNode?.url
      || await StorageService.getNodeUrlFromDB(sourceNodeId)
      || StorageService.getNodeUrl(sourceNodeId);
    if (!sourceUrl) {
      throw new Error(`No URL configured for source node ${sourceNodeId}`);
    }

    const chunkData = await StorageService.readChunk(sourceUrl, chunk.chunkId);

    // Verify the plaintext checksum with the same key used at upload time.
    const decrypted = decryptChunk(chunkData, getFileKey(file));
    const actualChecksum = sha256(decrypted);
    if (actualChecksum !== chunk.checksum) {
      throw new Error(
        `Source chunk ${chunk.chunkId} checksum mismatch - source data is corrupt`
      );
    }

    const excludeNodeIds = [
      failedNodeId,
      chunk.primaryNode,
      ...(chunk.replicaNodes || []),
    ].filter((id, index, all) => id && all.indexOf(id) === index);

    const replacementNode = await this._selectReplacementNode(
      chunk,
      excludeNodeIds,
      chunkData.length
    );

    if (!replacementNode) {
      console.warn(
        `[RecoveryManager] No replacement node available for chunk ${chunk.chunkId}; ` +
        'leaving chunk degraded.'
      );
      const updateFields = { status: 'DEGRADED' };
      if (chunk.primaryNode === failedNodeId) {
        const newPrimary = (chunk.replicaNodes || []).find(id => id !== failedNodeId);
        if (newPrimary) {
          updateFields.primaryNode = newPrimary;
          updateFields.replicaNodes = (chunk.replicaNodes || [])
            .filter(id => id !== failedNodeId && id !== newPrimary);
        } else {
          throw new Error('No primary candidate available');
        }
      } else {
        updateFields.replicaNodes = (chunk.replicaNodes || [])
          .filter(id => id !== failedNodeId);
      }
      await Chunk.findByIdAndUpdate(chunk._id, updateFields);
      return { replaced: false };
    }

    const replacementUrl = replacementNode.url
      || await StorageService.getNodeUrlFromDB(replacementNode.nodeId)
      || StorageService.getNodeUrl(replacementNode.nodeId);

    // The node stores encrypted bytes, so it must receive the hash of those
    // bytes. chunk.checksum remains the plaintext integrity value in metadata.
    await StorageService.writeChunk(
      replacementUrl,
      chunk.chunkId,
      chunkData,
      sha256(chunkData)
    );

    const updateFields = {};
    if (chunk.primaryNode === failedNodeId) {
      const newPrimary = (chunk.replicaNodes || []).find(id => id !== failedNodeId)
        || replacementNode.nodeId;
      updateFields.primaryNode = newPrimary;
      updateFields.replicaNodes = [
        ...(chunk.replicaNodes || []).filter(
          id => id !== failedNodeId && id !== newPrimary
        ),
        replacementNode.nodeId,
      ].filter((id, index, all) => id !== newPrimary && all.indexOf(id) === index);
    } else {
      updateFields.replicaNodes = [
        ...(chunk.replicaNodes || []).filter(id => id !== failedNodeId),
        replacementNode.nodeId,
      ].filter((id, index, all) => id !== failedNodeId && all.indexOf(id) === index);
    }
    updateFields.status = 'VERIFIED';

    await Chunk.findByIdAndUpdate(chunk._id, updateFields);

    await AuditLog.create({
      action: 'REPLICA_REPLACEMENT',
      status: 'SUCCESS',
      chunkId: chunk.chunkId,
      nodeId: replacementNode.nodeId,
      reason: `Replaced failed node ${failedNodeId}`,
      metadata: {
        sourceNodeId,
        encryptedBytes: chunkData.length,
      },
    }).catch(() => {});

    return { replaced: true };
  },

  /**
   * Find a healthy node that currently holds a copy of the chunk.
   */
  async _findHealthySource(chunk, excludeNodeId) {
    const candidates = [
      chunk.primaryNode !== excludeNodeId ? chunk.primaryNode : null,
      ...(chunk.replicaNodes || []).filter(id => id !== excludeNodeId),
    ].filter(Boolean);

    for (const nodeId of candidates) {
      const node = await StorageNode.findOne({ nodeId });
      if (node && (node.status === 'HEALTHY' || node.status === 'DEGRADED')) {
        return nodeId;
      }
    }
    return null;
  },

  /**
   * Select a healthy replacement node for re-replication.
   */
  async _selectReplacementNode(chunk, excludeNodeIds, requiredSpace) {
    const nodes = await StorageNode.find({
      status: 'HEALTHY',
      freeSpace: { $gt: requiredSpace },
      nodeId: { $nin: excludeNodeIds },
    }).sort({ currentLoad: 1 });

    return nodes[0] || null;
  },
};

module.exports = RecoveryManager;
