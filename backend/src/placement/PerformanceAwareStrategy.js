const PlacementStrategy = require('./PlacementStrategy');

/**
 * PerformanceAwareStrategy — Baseline A1
 *
 * Selects nodes based on a weighted combination of:
 *   - Available capacity (more is better)
 *   - Current load     (lower is better)
 *   - Latency          (lower is better)
 *   - Health status
 *
 * This is a heuristic baseline, NOT machine learning.
 * Claim: better than Round Robin when node conditions differ significantly.
 *
 * Does NOT consider: security eligibility, failure domain, joint pair evaluation.
 */
class PerformanceAwareStrategy extends PlacementStrategy {
  get strategyName() {
    return 'PERFORMANCE_AWARE';
  }

  /**
   * Compute a normalized 0–1 score for a node.
   * Higher score = better candidate.
   */
  _scoreNode(node, maxCapacity, maxLatency) {
    if (node.status === 'OFFLINE' || node.status === 'FULL' || node.status === 'RESTRICTED') {
      return -1;
    }

    // Normalize each metric to [0, 1]
    const capacityScore  = maxCapacity > 0 ? node.freeSpace / maxCapacity : 0;
    const loadScore      = 1 - (node.currentLoad || 0);      // lower load = higher score
    const latencyScore   = maxLatency > 0 ? 1 - (node.latency / maxLatency) : 1; // lower latency = higher score
    const healthBonus    = node.status === 'HEALTHY' ? 0.1 : 0;
    const degradedPenalty = node.status === 'DEGRADED' ? -0.2 : 0;

    // Equal weights for this baseline
    const score = (capacityScore * 0.35) + (loadScore * 0.35) + (latencyScore * 0.30) + healthBonus + degradedPenalty;
    return Math.max(0, score);
  }

  async selectNodes(context) {
    const start = Date.now();
    const { nodes, replicationFactor, chunkSize } = context;

    // Pre-filter: must be reachable and have space
    const eligible = nodes.filter(n =>
      n.status !== 'OFFLINE' &&
      n.status !== 'FULL' &&
      n.status !== 'RESTRICTED' &&
      n.freeSpace > chunkSize
    );

    if (eligible.length < replicationFactor) {
      throw new Error(
        `PerformanceAware: Not enough eligible nodes. Need ${replicationFactor}, found ${eligible.length}`
      );
    }

    // Compute normalization bounds
    const maxCapacity = Math.max(...eligible.map(n => n.freeSpace), 1);
    const maxLatency  = Math.max(...eligible.map(n => n.latency || 0), 1);

    // Score and sort descending
    const scored = eligible
      .map(n => ({ node: n, score: this._scoreNode(n, maxCapacity, maxLatency) }))
      .sort((a, b) => b.score - a.score);

    // Select top replicationFactor distinct nodes
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
      throw new Error('PerformanceAware: Could not select enough distinct nodes');
    }

    const decisionTimeMs = Date.now() - start;

    return {
      primary: selected[0],
      replicas: selected.slice(1),
      decisionTimeMs,
      metadata: {
        candidateCount: eligible.length,
        scores: scored.map(s => ({ nodeId: s.node.nodeId, score: s.score })),
      },
    };
  }
}

module.exports = new PerformanceAwareStrategy();
