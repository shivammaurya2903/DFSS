const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const config = require('../config');

/**
 * HeartbeatMonitor
 *
 * Runs as a background interval process on backend startup.
 * Periodically checks all registered storage nodes' lastHeartbeat timestamps.
 * If a node hasn't sent a heartbeat within HEARTBEAT_TIMEOUT_MS, it is marked OFFLINE.
 *
 * Grace period: Nodes can miss up to HEARTBEAT_MISSED_THRESHOLD heartbeats before being marked OFFLINE.
 * This prevents flapping due to brief network blips or GC pauses.
 *
 * This is the trigger for the failure detection -> recovery pipeline.
 */

let monitorInterval = null;
let failureHandlers = [];

const HeartbeatMonitor = {
  /**
   * Register a callback to be called when a node is detected as failed.
   * @param {function} handler - async (nodeId: string) => void
   */
  onNodeFailure(handler) {
    failureHandlers.push(handler);
  },

  /**
   * Start the background heartbeat monitor.
   * Call once from server startup.
   */
  start() {
    if (monitorInterval) {
      console.warn('[HeartbeatMonitor] Already running — skipping duplicate start.');
      return;
    }

    const missedThreshold = config.heartbeatMissedThreshold || 2;
    const checkIntervalMs = config.heartbeatIntervalMs;
    const timeoutMs = config.heartbeatTimeoutMs;

    console.log(
      `[HeartbeatMonitor] Started. Check interval: ${checkIntervalMs}ms, ` +
      `timeout: ${timeoutMs}ms, missed threshold: ${missedThreshold} heartbeats`
    );

    monitorInterval = setInterval(
      () => HeartbeatMonitor._check().catch(err =>
        console.error('[HeartbeatMonitor] Error during check:', err.message)
      ),
      checkIntervalMs
    );

    // Allow process to exit even if this interval is running
    if (monitorInterval.unref) monitorInterval.unref();
  },

  /**
   * Stop the background monitor.
   */
  stop() {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
      console.log('[HeartbeatMonitor] Stopped.');
    }
  },

  /**
   * Internal: check all nodes and mark timed-out ones as OFFLINE.
   * Uses grace period: node must miss N consecutive heartbeats before OFFLINE.
   */
  async _check() {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const now = Date.now();
    const timeoutThreshold = new Date(now - config.heartbeatTimeoutMs);
    const missedThreshold = config.heartbeatMissedThreshold || 2;

    // Find nodes that are currently alive but haven't heartbeat-ed recently
    const stalledNodes = await StorageNode.find({
      status: { $in: ['HEALTHY', 'DEGRADED'] },
      lastHeartbeat: { $lt: timeoutThreshold },
    });

    for (const node of stalledNodes) {
      // Increment missed heartbeats counter
      node.missedHeartbeats = (node.missedHeartbeats || 0) + 1;

      if (node.missedHeartbeats >= missedThreshold) {
        // Grace period exceeded - mark OFFLINE
        const wasStatus = node.status;
        node.status = 'OFFLINE';
        node.missedHeartbeats = 0; // Reset for next time
        await node.save();

        console.warn(
          `[HeartbeatMonitor] Node ${node.nodeId} marked OFFLINE ` +
          `(was ${wasStatus}, last heartbeat: ${node.lastHeartbeat?.toISOString()}, ` +
          `missed ${missedThreshold} heartbeats)`
        );

        // Audit log
        await AuditLog.create({
          action: 'NODE_FAILURE',
          status: 'SUCCESS',
          nodeId: node.nodeId,
          reason: `No heartbeat for ${config.heartbeatTimeoutMs}ms (missed ${missedThreshold} checks)`,
        }).catch(() => {}); // Don't fail monitor on audit write error

        // Notify registered failure handlers (e.g., RecoveryManager)
        for (const handler of failureHandlers) {
          handler(node.nodeId).catch(err =>
            console.error(`[HeartbeatMonitor] Failure handler error for ${node.nodeId}:`, err.message)
          );
        }
      } else {
        // Within grace period - just update counter
        await node.save();
        console.log(
          `[HeartbeatMonitor] Node ${node.nodeId} missed heartbeat ` +
          `(${node.missedHeartbeats}/${missedThreshold})`
        );
      }
    }

    // Reset missed heartbeats for nodes that are healthy (received heartbeat recently)
    await StorageNode.updateMany(
      {
        status: { $in: ['HEALTHY', 'DEGRADED'] },
        lastHeartbeat: { $gte: timeoutThreshold },
        missedHeartbeats: { $gt: 0 },
      },
      { $set: { missedHeartbeats: 0 } }
    );
  },
};

module.exports = HeartbeatMonitor;
