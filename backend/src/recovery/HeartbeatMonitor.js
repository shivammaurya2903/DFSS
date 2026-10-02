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
 * This is the trigger for the failure detection → recovery pipeline.
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

    console.log(
      `[HeartbeatMonitor] Started. Check interval: ${config.heartbeatIntervalMs}ms, ` +
      `timeout: ${config.heartbeatTimeoutMs}ms`
    );

    monitorInterval = setInterval(
      () => HeartbeatMonitor._check().catch(err =>
        console.error('[HeartbeatMonitor] Error during check:', err.message)
      ),
      config.heartbeatIntervalMs
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
   */
  async _check() {
    const now = Date.now();
    const timeoutThreshold = new Date(now - config.heartbeatTimeoutMs);

    // Find nodes that are currently alive but haven't heartbeat-ed recently
    const stalledNodes = await StorageNode.find({
      status: { $in: ['HEALTHY', 'DEGRADED'] },
      lastHeartbeat: { $lt: timeoutThreshold },
    });

    for (const node of stalledNodes) {
      const wasStatus = node.status;
      node.status = 'OFFLINE';
      await node.save();

      console.warn(
        `[HeartbeatMonitor] Node ${node.nodeId} marked OFFLINE ` +
        `(was ${wasStatus}, last heartbeat: ${node.lastHeartbeat?.toISOString()})`
      );

      // Audit log
      await AuditLog.create({
        action: 'NODE_FAILURE',
        status: 'SUCCESS',
        nodeId: node.nodeId,
        reason: `No heartbeat for ${config.heartbeatTimeoutMs}ms (last: ${node.lastHeartbeat?.toISOString()})`,
      }).catch(() => {}); // Don't fail monitor on audit write error

      // Notify registered failure handlers (e.g., RecoveryManager)
      for (const handler of failureHandlers) {
        handler(node.nodeId).catch(err =>
          console.error(`[HeartbeatMonitor] Failure handler error for ${node.nodeId}:`, err.message)
        );
      }
    }
  },
};

module.exports = HeartbeatMonitor;
