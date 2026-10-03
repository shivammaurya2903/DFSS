const StorageNode = require('../models/StorageNode');
const PlacementDecision = require('../models/PlacementDecision');
const roundRobin = require('./RoundRobinStrategy');
const performanceAware = require('./PerformanceAwareStrategy');
const proposedAdaptive = require('./ProposedAdaptiveStrategy');
const crypto = require('crypto');
const config = require('../config');

/**
 * PlacementPolicyManager
 *
 * Orchestrates placement strategy selection and executes the placement pipeline.
 * Handles decision recording for all strategies (required for research reproducibility).
 *
 * Usage:
 *   const result = await PlacementPolicyManager.place({
 *     file, chunkId, chunkSize, replicationFactor, runId, scenarioId
 *   });
 */

const strategyMap = {
  ROUND_ROBIN:       roundRobin,
  PERFORMANCE_AWARE: performanceAware,
  ADAPTIVE:          proposedAdaptive,
};

const PlacementPolicyManager = {
  /**
   * Execute placement for a single chunk.
   *
   * @param {object} opts
   * @param {object} opts.file        - File document (for security metadata)
   * @param {string} opts.chunkId     - Chunk identifier
   * @param {number} opts.chunkSize   - Chunk size in bytes
   * @param {number} opts.replicationFactor
   * @param {string} [opts.runId]     - Research run ID
   * @param {string} [opts.scenarioId]
   * @param {object} [opts.existingPlacements] - For re-evaluation: current primary/replica
   * @returns {Promise<{primary: StorageNode, replicas: StorageNode[], decisionRecord: PlacementDecision}>}
   */
  async place(opts) {
    const {
      file,
      chunkId,
      chunkSize,
      replicationFactor = config.replicationFactor,
      runId = null,
      scenarioId = null,
      existingPlacements = null,
    } = opts;

    // Determine strategy from file's placementPolicy
    const strategyKey = (file.placementPolicy || 'ADAPTIVE').toUpperCase().replace('-', '_');
    const strategy = strategyMap[strategyKey] || proposedAdaptive;

    // Load all current node states from DB
    const allNodes = await StorageNode.find({});
    
    // Only HEALTHY nodes are eligible for new placement (Phase 30)
    const eligibleNodes = allNodes.filter(n => n.status === 'HEALTHY');

    const context = {
      file,
      chunkId,
      chunkSize,
      replicationFactor,
      nodes: eligibleNodes,
      runId,
      scenarioId,
      existingPlacements,
    };

    // Execute strategy
    const result = await strategy.selectNodes(context);

    // Record decision in MongoDB (required for research reproducibility)
    const decisionId = `DEC-${crypto.randomUUID()}`;
    const decisionRecord = await PlacementDecision.create({
      decisionId,
      runId,
      scenarioId,
      fileId: file._id,
      chunkId,
      strategy: strategy.strategyName,
      candidateNodes: (result.metadata.candidateNodes || []),
      filteredNodes: (result.metadata.filteredNodes || []),
      candidatePairs: (result.metadata.candidatePairs || []),
      selectedPrimary: result.primary.nodeId,
      selectedReplica: result.replicas[0]?.nodeId || null,
      failureDomainInfo: {
        ...(result.metadata.failureDomainInfo || {}),
        warning: result.metadata.domainWarning
      },
      nodeMetricsSnapshot: allNodes.reduce((acc, n) => {
        acc[n.nodeId] = {
          status: n.status,
          freeSpace: n.freeSpace,
          currentLoad: n.currentLoad,
          latency: n.latency,
          failureDomainId: n.failureDomainId,
        };
        return acc;
      }, {}),
      score: result.metadata.score || null,
      adaptationCost: result.metadata.adaptationCost || {},
      decisionTimeMs: result.decisionTimeMs,
      reason: result.metadata.reason || `Strategy: ${strategy.strategyName}`,
      timestamp: new Date(),
    });

    return {
      primary: result.primary,
      replicas: result.replicas,
      decisionTimeMs: result.decisionTimeMs,
      decisionRecord,
      metadata: result.metadata,
    };
  },

  /**
   * Get the available strategy names.
   */
  getAvailableStrategies() {
    return Object.keys(strategyMap);
  },
};

module.exports = PlacementPolicyManager;
