/**
 * PlacementStrategy — Abstract base interface.
 *
 * All concrete strategies must implement selectNodes(context).
 *
 * context = {
 *   file: { sensitivity, securityClass, placementPolicy, ... },
 *   chunkId: string,
 *   chunkSize: number,         // bytes
 *   replicationFactor: number,
 *   nodes: StorageNode[],      // all nodes from DB
 *   runId: string | null,      // research run ID
 *   scenarioId: string | null,
 * }
 *
 * Returns:
 * {
 *   primary: StorageNode,
 *   replicas: StorageNode[],
 *   decisionTimeMs: number,
 *   metadata: object,  // strategy-specific extras for PlacementDecision record
 * }
 */
class PlacementStrategy {
  /**
   * @param {object} context
   * @returns {Promise<{primary, replicas, decisionTimeMs, metadata}>}
   */
  // eslint-disable-next-line no-unused-vars
  async selectNodes(context) {
    throw new Error('PlacementStrategy.selectNodes() must be implemented by subclass');
  }

  get strategyName() {
    return 'BASE';
  }
}

module.exports = PlacementStrategy;
