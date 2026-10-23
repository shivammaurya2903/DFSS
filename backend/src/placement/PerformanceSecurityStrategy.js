const PlacementStrategy = require('./PlacementStrategy');

/**
 * PerformanceSecurityStrategy - Baseline A2
 *
 * Extends the performance-aware baseline with a hard security eligibility
 * constraint. It does not evaluate joint primary/replica pairs, failure-domain
 * diversity, or adaptation cost (those belong to the proposed A3 strategy).
 */
class PerformanceSecurityStrategy extends PlacementStrategy {
  get strategyName() {
    return 'PERFORMANCE_SECURITY';
  }

  _isSecurityEligible(node, file) {
    if (!node.securityCapabilities || node.securityCapabilities.length === 0) {
      return file.sensitivity === 'PUBLIC';
    }
    return node.securityCapabilities.includes(file.sensitivity);
  }

  _scoreNode(node, maxCapacity, maxLatency) {
    const capacityScore = maxCapacity > 0 ? node.freeSpace / maxCapacity : 0;
    const loadScore = 1 - (node.currentLoad || 0);
    const latencyScore = maxLatency > 0 ? 1 - (node.latency / maxLatency) : 1;
    const healthBonus = node.status === 'HEALTHY' ? 0.1 : 0;
    const degradedPenalty = node.status === 'DEGRADED' ? -0.2 : 0;

    return Math.max(
      0,
      (capacityScore * 0.35) + (loadScore * 0.35) + (latencyScore * 0.30)
        + healthBonus + degradedPenalty
    );
  }

  async selectNodes(context) {
    const start = Date.now();
    const { nodes, file, replicationFactor, chunkSize } = context;

    const filtered = [];
    const eligible = [];

    for (const node of nodes) {
      const reasons = [];
      if (!['HEALTHY', 'DEGRADED'].includes(node.status)) {
        reasons.push(`health=${node.status}`);
      }
      if (node.freeSpace <= chunkSize) {
        reasons.push(`insufficient_space(free=${node.freeSpace},need=${chunkSize})`);
      }
      if (!this._isSecurityEligible(node, file)) {
        reasons.push(`security_ineligible(sensitivity=${file.sensitivity})`);
      }

      if (reasons.length === 0) {
        eligible.push(node);
      } else {
        filtered.push({ nodeId: node.nodeId, reason: reasons.join(', ') });
      }
    }

    if (eligible.length < replicationFactor) {
      const err = new Error(
        `PerformanceSecurity: Not enough eligible nodes. Need ${replicationFactor}, found ${eligible.length}`
      );
      err.code = 'INSUFFICIENT_ELIGIBLE_NODES';
      err.requiredNodes = replicationFactor;
      err.eligibleNodes = eligible.length;
      err.filteredNodes = filtered;
      throw err;
    }

    const maxCapacity = Math.max(...eligible.map(n => n.freeSpace), 1);
    const maxLatency = Math.max(...eligible.map(n => n.latency || 0), 1);

    const scored = eligible
      .map(node => ({ node, score: this._scoreNode(node, maxCapacity, maxLatency) }))
      .sort((a, b) => b.score - a.score);

    const selected = [];
    const usedIds = new Set();
    for (const { node } of scored) {
      if (!usedIds.has(node.nodeId)) {
        usedIds.add(node.nodeId);
        selected.push(node);
        if (selected.length >= replicationFactor) break;
      }
    }

    if (selected.length < replicationFactor) {
      throw new Error('PerformanceSecurity: Could not select enough distinct nodes');
    }

    return {
      primary: selected[0],
      replicas: selected.slice(1),
      decisionTimeMs: Date.now() - start,
      metadata: {
        candidateNodes: eligible.map(n => n.nodeId),
        filteredNodes: filtered,
        scores: scored.map(s => ({ nodeId: s.node.nodeId, score: s.score })),
        reason: 'Performance-aware selection with hard security eligibility',
      },
    };
  }
}

module.exports = new PerformanceSecurityStrategy();
