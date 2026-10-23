jest.mock('../src/models/StorageNode');
jest.mock('../src/models/PlacementDecision');

const StorageNode = require('../src/models/StorageNode');
const PlacementDecision = require('../src/models/PlacementDecision');
const PlacementPolicyManager = require('../src/placement/PlacementPolicyManager');
const strategy = require('../src/placement/PerformanceSecurityStrategy');

const node = (overrides) => ({
  nodeId: 'node-1',
  status: 'HEALTHY',
  freeSpace: 10 * 1024 * 1024,
  currentLoad: 0.1,
  latency: 10,
  securityCapabilities: ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
  ...overrides,
});

describe('PerformanceSecurityStrategy (A2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('excludes nodes that cannot store the file sensitivity', async () => {
    const result = await strategy.selectNodes({
      file: { sensitivity: 'SENSITIVE', securityClass: 'HIGH' },
      chunkSize: 1024,
      replicationFactor: 2,
      nodes: [
        node({ nodeId: 'public-only', securityCapabilities: ['PUBLIC'] }),
        node({ nodeId: 'secure-1' }),
        node({ nodeId: 'secure-2', currentLoad: 0.2 }),
      ],
    });

    expect(result.primary.nodeId).toBe('secure-1');
    expect(result.replicas.map(r => r.nodeId)).toEqual(['secure-2']);
    expect(result.metadata.filteredNodes).toEqual([
      expect.objectContaining({ nodeId: 'public-only', reason: expect.stringContaining('security_ineligible') }),
    ]);
  });

  test('rejects placement when fewer eligible nodes than the replication factor', async () => {
    await expect(strategy.selectNodes({
      file: { sensitivity: 'SENSITIVE' },
      chunkSize: 1024,
      replicationFactor: 2,
      nodes: [
        node({ nodeId: 'secure-1' }),
        node({ nodeId: 'public-only', securityCapabilities: ['PUBLIC'] }),
      ],
    })).rejects.toMatchObject({
      code: 'INSUFFICIENT_ELIGIBLE_NODES',
      requiredNodes: 2,
      eligibleNodes: 1,
    });
  });

  test('prefers the healthier, lower-load node for the primary', async () => {
    const result = await strategy.selectNodes({
      file: { sensitivity: 'PRIVATE' },
      chunkSize: 1024,
      replicationFactor: 2,
      nodes: [
        node({ nodeId: 'busy', currentLoad: 0.9, freeSpace: 1024 * 1024, latency: 100 }),
        node({ nodeId: 'idle', currentLoad: 0.05, freeSpace: 50 * 1024 * 1024, latency: 5 }),
        node({ nodeId: 'degraded', status: 'DEGRADED', currentLoad: 0.01, freeSpace: 60 * 1024 * 1024, latency: 1 }),
      ],
    });

    expect(result.primary.nodeId).toBe('idle');
    expect(result.metadata.reason).toMatch(/security eligibility/i);
  });

  test('PlacementPolicyManager routes A2 alias through production pipeline and records decision', async () => {
    const testNodes = [
      node({ nodeId: 'insecure', securityCapabilities: ['PUBLIC'], freeSpace: 20 * 1024 * 1024, currentLoad: 0.01 }),
      node({ nodeId: 'secure-1', securityCapabilities: ['SENSITIVE'], freeSpace: 20 * 1024 * 1024, currentLoad: 0.1 }),
      node({ nodeId: 'secure-2', securityCapabilities: ['SENSITIVE'], freeSpace: 20 * 1024 * 1024, currentLoad: 0.2 }),
    ];
    StorageNode.find.mockResolvedValue(testNodes);
    PlacementDecision.create.mockImplementation((doc) => Promise.resolve(doc));

    const result = await PlacementPolicyManager.place({
      file: { _id: 'file-123', placementPolicy: 'A2', sensitivity: 'SENSITIVE' },
      chunkId: 'file-123_0',
      chunkSize: 1024,
      replicationFactor: 2,
      runId: 'run-a2',
      scenarioId: 'scen-a2',
    });

    expect(result.primary.nodeId).toBe('secure-1');
    expect(result.replicas.map(r => r.nodeId)).toEqual(['secure-2']);
    expect(PlacementDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: 'PERFORMANCE_SECURITY',
        runId: 'run-a2',
        scenarioId: 'scen-a2',
        selectedPrimary: 'secure-1',
      })
    );
  });
});
