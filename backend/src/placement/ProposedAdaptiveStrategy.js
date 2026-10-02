const PlacementStrategy = require('./PlacementStrategy');
const config = require('../config');

/**
 * ProposedAdaptiveStrategy — Proposed Multi-Objective Adaptive Placement (A3)
 *
 * This is the CORE RESEARCH CONTRIBUTION of the project.
 *
 * Research Position:
 *   "A lightweight, reproducible study of multi-objective primary and replica
 *    placement under dynamically changing node conditions, focusing on the
 *    interaction and trade-offs among performance, security, reliability,
 *    storage utilization, and adaptation cost."
 *
 * Key innovations over baselines:
 *   1. Hard constraints filter (security eligibility, health, capacity, failure domain)
 *   2. JOINT primary/replica pair generation and evaluation
 *   3. Multi-objective pair scoring with configurable weights
 *   4. Adaptation cost modeling
 *   5. Failure-domain awareness
 *
 * Pipeline:
 *   Node metrics
 *     → Hard constraints filter
 *     → Generate valid primary/replica pairs
 *     → Multi-objective pair scoring
 *     → Joint placement decision
 *     → Record decision
 */
class ProposedAdaptiveStrategy extends PlacementStrategy {
  get strategyName() {
    return 'ADAPTIVE';
  }

  // ============================================================
  // STEP 1: HARD CONSTRAINTS
  // Nodes failing any constraint are completely excluded.
  // These are not soft preferences — they are hard gates.
  // ============================================================

  /**
   * Check security eligibility.
   * A node must support the file's sensitivity level.
   */
  _passesSecurityConstraint(node, file) {
    if (!node.securityCapabilities || node.securityCapabilities.length === 0) {
      // If no capabilities declared, assume it can only handle PUBLIC
      return file.sensitivity === 'PUBLIC';
    }
    return node.securityCapabilities.includes(file.sensitivity);
  }

  /**
   * Check health constraint.
   * Only HEALTHY nodes are eligible primaries.
   * DEGRADED nodes may serve as replicas if policy allows.
   */
  _passesHealthConstraint(node, asPrimary = true) {
    if (asPrimary) {
      return node.status === 'HEALTHY';
    }
    return node.status === 'HEALTHY' || node.status === 'DEGRADED';
  }

  /**
   * Check capacity constraint.
   * Node must have enough free space for the chunk.
   */
  _passesCapacityConstraint(node, chunkSize) {
    return node.freeSpace > chunkSize;
  }

  /**
   * Apply all hard constraints and return eligible nodes with reasons for filtered ones.
   */
  _applyHardConstraints(nodes, file, chunkSize) {
    const eligible = [];
    const filtered = [];

    for (const node of nodes) {
      const reasons = [];

      if (!this._passesHealthConstraint(node, true)) {
        reasons.push(`health=${node.status}`);
      }
      if (!this._passesCapacityConstraint(node, chunkSize)) {
        reasons.push(`insufficient_space(free=${node.freeSpace},need=${chunkSize})`);
      }
      if (!this._passesSecurityConstraint(node, file)) {
        reasons.push(`security_ineligible(sensitivity=${file.sensitivity})`);
      }

      if (reasons.length === 0) {
        eligible.push(node);
      } else {
        filtered.push({ nodeId: node.nodeId, reason: reasons.join(', ') });
      }
    }

    return { eligible, filtered };
  }

  // ============================================================
  // STEP 2: GENERATE VALID PRIMARY/REPLICA PAIRS
  // Primary and replica must be on DIFFERENT nodes.
  // When multiple failure domains exist, prefer cross-domain pairs.
  // ============================================================

  _generateCandidatePairs(eligibleNodes) {
    const pairs = [];

    for (let i = 0; i < eligibleNodes.length; i++) {
      for (let j = 0; j < eligibleNodes.length; j++) {
        if (i === j) continue; // primary ≠ replica
        if (eligibleNodes[i].nodeId === eligibleNodes[j].nodeId) continue;

        pairs.push({
          primary: eligibleNodes[i],
          replica: eligibleNodes[j],
        });
      }
    }

    return pairs;
  }

  // ============================================================
  // STEP 3: MULTI-OBJECTIVE PAIR SCORING
  //
  // PairScore =
  //     w1 * Performance
  //   + w2 * LoadBalance
  //   + w3 * LowLatency
  //   + w4 * Reliability
  //   + w5 * ReplicaDiversity
  //   - w6 * AdaptationCost
  //
  // Weights are configurable via environment variables.
  // This formula is NOT claimed as universally optimal —
  // it is a reasonable multi-objective heuristic for the study.
  // ============================================================

  _scorePair(primary, replica, existingPlacements, normBounds) {
    const { maxFreeSpace, maxLatency, maxLoad } = normBounds;
    const w = config.placementWeights;

    // --- Performance: free space of primary ---
    const perfScore = maxFreeSpace > 0 ? primary.freeSpace / maxFreeSpace : 0;

    // --- Load Balance: inverse of primary load ---
    const loadScore = 1 - (primary.currentLoad || 0);

    // --- Low Latency: inverse of max(primary.latency, replica.latency) ---
    const maxPairLatency = Math.max(primary.latency || 0, replica.latency || 0);
    const latencyScore = maxLatency > 0 ? 1 - (maxPairLatency / maxLatency) : 1;

    // --- Reliability: both nodes healthy ---
    const reliabilityScore =
      (primary.status === 'HEALTHY' ? 0.6 : 0.3) +
      (replica.status === 'HEALTHY' ? 0.4 : 0.2);

    // --- Replica Diversity: cross-failure-domain bonus ---
    const crossDomain = primary.failureDomainId !== replica.failureDomainId ? 1.0 : 0.2;
    // Note: in prototype all nodes share LOCAL-HDD so crossDomain will always be 0.2
    const diversityScore = crossDomain;

    // --- Adaptation Cost: penalty if moving existing chunk ---
    let adaptationCostScore = 0;
    if (existingPlacements && existingPlacements.primary) {
      if (existingPlacements.primary !== primary.nodeId) {
        adaptationCostScore += 0.5; // migration cost
      }
      if (existingPlacements.replica && existingPlacements.replica !== replica.nodeId) {
        adaptationCostScore += 0.3;
      }
    }

    const totalScore =
        (w.performance       * perfScore)
      + (w.loadBalance        * loadScore)
      + (w.lowLatency         * latencyScore)
      + (w.reliability        * reliabilityScore)
      + (w.replicaDiversity   * diversityScore)
      - (w.adaptationCost     * adaptationCostScore);

    return {
      total: Math.max(0, totalScore),
      breakdown: {
        perfScore,
        loadScore,
        latencyScore,
        reliabilityScore,
        diversityScore,
        adaptationCostScore,
      },
    };
  }

  // ============================================================
  // MAIN: selectNodes
  // ============================================================

  async selectNodes(context) {
    const start = Date.now();
    const {
      nodes,
      file,
      chunkSize,
      replicationFactor,
      existingPlacements = null, // for re-evaluation/migration scenarios
    } = context;

    // Step 1: Apply hard constraints
    const { eligible, filtered } = this._applyHardConstraints(nodes, file, chunkSize);

    if (eligible.length < replicationFactor) {
      throw new Error(
        `ProposedAdaptive: Hard constraints left only ${eligible.length} eligible node(s), ` +
        `need ${replicationFactor}. Filtered: ${filtered.map(f => `${f.nodeId}(${f.reason})`).join(', ')}`
      );
    }

    // Step 2: Generate valid primary/replica pairs
    const pairs = this._generateCandidatePairs(eligible);

    if (pairs.length === 0) {
      throw new Error('ProposedAdaptive: No valid primary/replica pairs could be generated');
    }

    // Compute normalization bounds across eligible nodes
    const maxFreeSpace = Math.max(...eligible.map(n => n.freeSpace), 1);
    const maxLatency   = Math.max(...eligible.map(n => n.latency || 0), 1);
    const maxLoad      = Math.max(...eligible.map(n => n.currentLoad || 0), 0.01);
    const normBounds   = { maxFreeSpace, maxLatency, maxLoad };

    // Step 3: Score each pair
    const scoredPairs = pairs.map(pair => {
      const scored = this._scorePair(pair.primary, pair.replica, existingPlacements, normBounds);
      return {
        primary: pair.primary,
        replica: pair.replica,
        score: scored.total,
        breakdown: scored.breakdown,
      };
    });

    // Sort descending by score — best pair first
    scoredPairs.sort((a, b) => b.score - a.score);
    const best = scoredPairs[0];

    const decisionTimeMs = Date.now() - start;

    return {
      primary: best.primary,
      replicas: [best.replica],
      decisionTimeMs,
      metadata: {
        candidateNodes: eligible.map(n => n.nodeId),
        filteredNodes: filtered,
        candidatePairs: scoredPairs.map(p => ({
          primary: p.primary.nodeId,
          replica: p.replica.nodeId,
          score: p.score,
        })),
        selectedPrimary: best.primary.nodeId,
        selectedReplica: best.replica.nodeId,
        score: best.score,
        scoreBreakdown: best.breakdown,
        failureDomainInfo: {
          primaryDomain: best.primary.failureDomainId,
          replicaDomain: best.replica.failureDomainId,
          sameDomain: best.primary.failureDomainId === best.replica.failureDomainId,
        },
        weights: config.placementWeights,
      },
    };
  }
}

module.exports = new ProposedAdaptiveStrategy();
