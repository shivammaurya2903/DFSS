const StorageNode = require('../models/StorageNode');

/**
 * ConditionFaultInjector — Research Layer Only
 *
 * Injects simulated/logical conditions into storage nodes for controlled experiments.
 *
 * IMPORTANT DISCLAIMER:
 * All conditions injected by this module are LOGICAL/SIMULATED values.
 * They do NOT represent actual physical hardware measurements.
 * The prototype uses four logical nodes on ONE physical HDD (LOCAL-HDD domain).
 * Injected conditions must be clearly marked as SIMULATED in all research outputs.
 *
 * This module is ONLY active when RESEARCH_MODE=true.
 * It must NEVER modify normal production node metrics silently.
 *
 * Supports injecting:
 *   - capacity (simulated free space)
 *   - load     (simulated load factor 0.0–1.0)
 *   - latency  (simulated latency in ms)
 *   - status   (simulate DEGRADED/OFFLINE)
 *   - security eligibility (restrict what sensitivity a node handles)
 */
const ConditionFaultInjector = {

  /**
   * Apply a condition profile to nodes.
   * Profile is an array of per-node conditions.
   *
   * @param {Array<object>} profile - Array of { nodeId, capacity?, load?, latencyMs?, status?, securityCapabilities? }
   * @param {string} scenarioId     - Identifies the scenario (for logging)
   * @returns {Promise<void>}
   */
  async applyProfile(profile, scenarioId = 'UNKNOWN') {
    if (process.env.RESEARCH_MODE !== 'true') {
      throw new Error('ConditionFaultInjector is only available in RESEARCH_MODE=true');
    }

    console.log(`[ConditionFaultInjector] Applying profile for scenario: ${scenarioId}`);

    for (const condition of profile) {
      const { nodeId, capacity, load, latencyMs, status, securityCapabilities } = condition;

      const node = await StorageNode.findOne({ nodeId });
      if (!node) {
        console.warn(`[ConditionFaultInjector] Node ${nodeId} not found — skipping`);
        continue;
      }

      const injected = {
        active: true,
        note: `SIMULATED — Scenario: ${scenarioId}. NOT real hardware measurement.`,
      };

      if (capacity !== undefined) {
        injected.capacity = capacity;
        node.freeSpace = capacity;
        node.capacity = Math.max(capacity, node.capacity);
      }
      if (load !== undefined) {
        injected.load = load;
        node.currentLoad = Math.min(1.0, Math.max(0, load));
      }
      if (latencyMs !== undefined) {
        injected.latency = latencyMs;
        node.latency = Math.max(0, latencyMs);
      }
      if (status !== undefined) {
        injected.status = status;
        node.status = status;
      }
      if (securityCapabilities !== undefined) {
        node.securityCapabilities = securityCapabilities;
      }

      node.injectedConditions = injected;
      await node.save();

      console.log(
        `[ConditionFaultInjector] [SIMULATED] Node ${nodeId}: ` +
        JSON.stringify({ capacity, load, latencyMs, status })
      );
    }
  },

  /**
   * Clear all injected conditions and restore nodes to their real last-heartbeat state.
   * After clearing, the next heartbeat from each node will update the real metrics.
   *
   * @returns {Promise<void>}
   */
  async clearAll() {
    if (process.env.RESEARCH_MODE !== 'true') {
      throw new Error('ConditionFaultInjector is only available in RESEARCH_MODE=true');
    }

    await StorageNode.updateMany(
      { 'injectedConditions.active': true },
      {
        $set: {
          'injectedConditions.active': false,
          'injectedConditions.note': 'Cleared — awaiting next real heartbeat',
        },
      }
    );

    console.log('[ConditionFaultInjector] All injected conditions cleared.');
  },

  /**
   * Inject a node failure (mark node as OFFLINE).
   * Used to test recovery pipeline.
   *
   * @param {string} nodeId
   * @param {string} scenarioId
   */
  async injectFailure(nodeId, scenarioId = 'UNKNOWN') {
    await this.applyProfile([{ nodeId, status: 'OFFLINE' }], scenarioId);
    console.log(`[ConditionFaultInjector] [SIMULATED FAILURE] Node ${nodeId} set OFFLINE`);
  },

  /**
   * Restore a previously failed node to HEALTHY.
   *
   * @param {string} nodeId
   */
  async restoreNode(nodeId) {
    if (process.env.RESEARCH_MODE !== 'true') {
      throw new Error('ConditionFaultInjector is only available in RESEARCH_MODE=true');
    }

    const node = await StorageNode.findOne({ nodeId });
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.status = 'HEALTHY';
    node.injectedConditions = {
      active: false,
      note: 'Restored — awaiting next real heartbeat',
    };
    await node.save();
    console.log(`[ConditionFaultInjector] Node ${nodeId} restored to HEALTHY`);
  },

  /**
   * Predefined scenarios for ablation studies.
   * These are ready-to-use research profiles.
   */
  SCENARIOS: {
    BALANCED: [
      { nodeId: 'node-1', capacity: 100 * 1024 * 1024 * 1024, load: 0.25, latencyMs: 10 },
      { nodeId: 'node-2', capacity: 100 * 1024 * 1024 * 1024, load: 0.25, latencyMs: 10 },
      { nodeId: 'node-3', capacity: 100 * 1024 * 1024 * 1024, load: 0.25, latencyMs: 10 },
      { nodeId: 'node-4', capacity: 100 * 1024 * 1024 * 1024, load: 0.25, latencyMs: 10 },
    ],
    UNEQUAL_LOAD: [
      { nodeId: 'node-1', capacity: 100 * 1024 * 1024 * 1024, load: 0.85, latencyMs: 20 },
      { nodeId: 'node-2', capacity: 100 * 1024 * 1024 * 1024, load: 0.20, latencyMs: 80 },
      { nodeId: 'node-3', capacity: 100 * 1024 * 1024 * 1024, load: 0.50, latencyMs: 30 },
      { nodeId: 'node-4', capacity: 100 * 1024 * 1024 * 1024, load: 0.10, latencyMs: 15 },
    ],
    UNEQUAL_CAPACITY: [
      { nodeId: 'node-1', capacity: 10 * 1024 * 1024 * 1024,  load: 0.20, latencyMs: 10 },
      { nodeId: 'node-2', capacity: 100 * 1024 * 1024 * 1024, load: 0.20, latencyMs: 10 },
      { nodeId: 'node-3', capacity: 50 * 1024 * 1024 * 1024,  load: 0.20, latencyMs: 10 },
      { nodeId: 'node-4', capacity: 200 * 1024 * 1024 * 1024, load: 0.20, latencyMs: 10 },
    ],
    SECURITY_RESTRICTED: [
      { nodeId: 'node-1', securityCapabilities: ['PUBLIC'] },
      { nodeId: 'node-2', securityCapabilities: ['PUBLIC', 'PRIVATE'] },
      { nodeId: 'node-3', securityCapabilities: ['PUBLIC', 'PRIVATE', 'SENSITIVE'] },
      { nodeId: 'node-4', securityCapabilities: ['PUBLIC', 'PRIVATE', 'SENSITIVE'] },
    ],
    PRIMARY_FAILURE: [
      { nodeId: 'node-1', status: 'OFFLINE' },
    ],
  },
};

module.exports = ConditionFaultInjector;
