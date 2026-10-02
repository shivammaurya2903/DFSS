const Chunk = require('../models/Chunk');
const File = require('../models/File');
const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const StorageService = require('../services/StorageService');
const PlacementPolicyManager = require('../placement/PlacementPolicyManager');
const config = require('../config');

/**
 * RecoveryManager
 *
 * Handles failure recovery when a storage node goes OFFLINE.
 *
 * Recovery pipeline:
 *   1. Find all chunks that had the failed node as primary or replica
 *   2. For primary failures: verify replica exists + serves requests
 *   3. Select a healthy replacement node using the placement strategy
 *   4. Copy chunk data from replica → replacement node
 *   5. Verify checksum on replacement node
 *   6. Update metadata: new primary or add new replica
 *   7. File status: DEGRADED → RECOVERING → READY
 *
 * Records recovery metrics for research analysis.
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

    // Find all chunks affected by this failure
    const affectedChunks = await Chunk.find({
      $or: [
        { primaryNode: failedNodeId },
        { replicaNodes: failedNodeId },
      ],
      status: { $nin: ['FAILED'] },
    });

    if (affectedChunks.length === 0) {
      console.log(`[RecoveryManager] No affected chunks for node ${failedNodeId}`);
      return;
    }

    console.log(`[RecoveryManager] ${affectedChunks.length} chunk(s) affected by ${failedNodeId}`);

    // Mark affected files as DEGRADED
    const affectedFileIds = [...new Set(affectedChunks.map(c => c.fileId.toString()))];
    await File.updateMany(
      { _id: { $in: affectedFileIds }, status: 'READY' },
      { status: 'DEGRADED' }
    );

    let recoveredCount = 0;
    let failedCount = 0;
    let totalBytesRecovered = 0;

    for (const chunk of affectedChunks) {
      try {
        await this._recoverChunk(chunk, failedNodeId);
        recoveredCount++;
        totalBytesRecovered += chunk.size || 0;
      } catch (err) {
        failedCount++;
        console.error(
          `[RecoveryManager] Failed to recover chunk ${chunk.chunkId}: ${err.message}`
        );
        await Chunk.findByIdAndUpdate(chunk._id, { status: 'FAILED' });
      }
    }

    // Mark files READY if all their chunks are recovered
    for (const fileId of affectedFileIds) {
      const degradedChunks = await Chunk.countDocuments({ fileId, status: 'FAILED' });
      if (degradedChunks === 0) {
        await File.findByIdAndUpdate(fileId, { status: 'READY' });
      }
    }

    const recoveryTimeMs = Date.now() - recoveryStart;

    await AuditLog.create({
      action: 'NODE_RECOVERY',
      status: failedCount === 0 ? 'SUCCESS' : 'FAILURE',
      nodeId: failedNodeId,
      latencyMs: recoveryTimeMs,
      metadata: {
        affectedChunks: affectedChunks.length,
        recoveredCount,
        failedCount,
        totalBytesRecovered,
        recoveryTimeMs,
      },
    }).catch(() => {});

    console.log(
      `[RecoveryManager] Recovery complete for ${failedNodeId}: ` +
      `${recoveredCount} recovered, ${failedCount} failed. Time: ${recoveryTimeMs}ms`
    );
  },

  /**
   * Recover a single chunk after its node failed.
   */
  async _recoverChunk(chunk, failedNodeId) {
    // Find the best source: a healthy node that has this chunk
    const sourceNodeId = await this._findHealthySource(chunk, failedNodeId);
    if (!sourceNodeId) {
      throw new Error(`No healthy source for chunk ${chunk.chunkId}`);
    }

    const sourceNode = await StorageNode.findOne({ nodeId: sourceNodeId });
    const sourceUrl = sourceNode?.url || StorageService.getNodeUrl(sourceNodeId);

    // Read chunk data from source
    const chunkData = await StorageService.readChunk(sourceUrl, chunk.chunkId);

    // Verify checksum
    const crypto = require('crypto');
    const encKey = Buffer.from(config.encryptionKey.padEnd(32, '0').slice(0, 32));
    const iv = chunkData.slice(0, 16);
    const ciphertext = chunkData.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const actualChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');

    if (actualChecksum !== chunk.checksum) {
      throw new Error(`Source chunk ${chunk.chunkId} checksum mismatch — source data is corrupt`);
    }

    // Find a replacement node (different from failed + current nodes)
    const excludeNodeIds = [
      failedNodeId,
      chunk.primaryNode,
      ...chunk.replicaNodes,
    ].filter(id => id !== failedNodeId);

    const replacementNode = await this._selectReplacementNode(
      chunk, excludeNodeIds, chunkData.length
    );

    if (!replacementNode) {
      console.warn(`[RecoveryManager] No replacement node available for chunk ${chunk.chunkId}, leaving degraded.`);
      const updateFields = { status: 'DEGRADED' };
      if (chunk.primaryNode === failedNodeId) {
        const newPrimary = chunk.replicaNodes.find(id => id !== failedNodeId);
        if (newPrimary) {
          updateFields.primaryNode = newPrimary;
          updateFields.replicaNodes = chunk.replicaNodes.filter(id => id !== failedNodeId && id !== newPrimary);
        } else {
          throw new Error(`No primary candidate available`);
        }
      } else {
        updateFields.replicaNodes = chunk.replicaNodes.filter(id => id !== failedNodeId);
      }
      await Chunk.findByIdAndUpdate(chunk._id, updateFields);
      return;
    }

    const replacementUrl = replacementNode.url || StorageService.getNodeUrl(replacementNode.nodeId);

    // Write to replacement node
    await StorageService.writeChunk(replacementUrl, chunk.chunkId, chunkData, chunk.checksum);

    // Update metadata
    const updateFields = {};
    if (chunk.primaryNode === failedNodeId) {
      // Promote first available replica as new primary, add replacement as new replica
      const newPrimary = chunk.replicaNodes.find(id => id !== failedNodeId) || replacementNode.nodeId;
      updateFields.primaryNode = newPrimary;
      updateFields.replicaNodes = [
        ...chunk.replicaNodes.filter(id => id !== failedNodeId && id !== newPrimary),
        replacementNode.nodeId,
      ].filter(id => id !== newPrimary);
    } else {
      // Failed node was a replica — replace it
      updateFields.replicaNodes = [
        ...chunk.replicaNodes.filter(id => id !== failedNodeId),
        replacementNode.nodeId,
      ];
    }
    updateFields.status = 'VERIFIED';

    await Chunk.findByIdAndUpdate(chunk._id, updateFields);

    await AuditLog.create({
      action: 'REPLICA_REPLACEMENT',
      status: 'SUCCESS',
      chunkId: chunk.chunkId,
      nodeId: replacementNode.nodeId,
      reason: `Replaced failed node ${failedNodeId}`,
    }).catch(() => {});
  },

  /**
   * Find a healthy node that currently holds a copy of the chunk.
   */
  async _findHealthySource(chunk, excludeNodeId) {
    const candidates = [
      chunk.primaryNode !== excludeNodeId ? chunk.primaryNode : null,
      ...chunk.replicaNodes.filter(id => id !== excludeNodeId),
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
