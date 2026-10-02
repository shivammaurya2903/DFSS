const PlacementStrategy = require('./PlacementStrategy');

/**
 * RoundRobinStrategy — Baseline A0
 *
 * Deterministic sequential cycling through available nodes.
 * C1→N1, C2→N2, C3→N3, C4→N4, C5→N1, ...
 *
 * Intentionally simple. Used as the baseline for research comparison.
 *
 * Does NOT consider: load, latency, security, failure domain.
 * Only skips OFFLINE and FULL nodes.
 */

let rrCounter = 0; // In-memory counter; resets on server restart

class RoundRobinStrategy extends PlacementStrategy {
  get strategyName() {
    return 'ROUND_ROBIN';
  }

  async selectNodes(context) {
    const start = Date.now();
    const { nodes, replicationFactor, chunkSize } = context;

    // Filter: only HEALTHY nodes with enough free space
    const eligible = nodes.filter(n =>
      n.status === 'HEALTHY' &&
      n.freeSpace > chunkSize
    );

    if (eligible.length < replicationFactor) {
      throw new Error(
        `RoundRobin: Not enough eligible nodes. Need ${replicationFactor}, found ${eligible.length}`
      );
    }

    const selected = [];
    const usedIndexes = new Set();

    for (let i = 0; i < replicationFactor; i++) {
      let attempts = 0;
      while (attempts < eligible.length) {
        const idx = rrCounter % eligible.length;
        rrCounter++;
        if (!usedIndexes.has(idx)) {
          usedIndexes.add(idx);
          selected.push(eligible[idx]);
          break;
        }
        attempts++;
      }
    }

    if (selected.length < replicationFactor) {
      throw new Error('RoundRobin: Could not select enough distinct nodes');
    }

    const decisionTimeMs = Date.now() - start;

    return {
      primary: selected[0],
      replicas: selected.slice(1),
      decisionTimeMs,
      metadata: {
        candidateCount: eligible.length,
        rrCounter,
      },
    };
  }
}

module.exports = new RoundRobinStrategy();
