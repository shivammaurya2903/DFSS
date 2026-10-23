const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/config/app');
const config = require('../src/config');
const ConditionFaultInjector = require('../src/research/ConditionFaultInjector');
const ExperimentRun = require('../src/models/ExperimentRun');
const StorageNode = require('../src/models/StorageNode');
const AuditLog = require('../src/models/AuditLog');

jest.mock('../src/models/ExperimentRun');
jest.mock('../src/models/StorageNode');
jest.mock('../src/models/AuditLog');
jest.mock('../src/research/ConditionFaultInjector');

const app = createApp();

function generateToken(role = 'admin') {
  return jwt.sign({ userId: 'test-admin-id', role }, config.jwtSecret);
}

describe('Research API & Experiment Pipeline', () => {
  const originalResearchMode = config.researchMode;

  beforeEach(() => {
    jest.clearAllMocks();
    config.researchMode = true;
    ConditionFaultInjector.SCENARIOS = {
      BALANCED: [],
      HIGH_LATENCY: [{ nodeId: 'node-1', latency: 200 }],
      UNEQUAL_LOAD: [{ nodeId: 'node-2', currentLoad: 0.85 }],
    };
    ConditionFaultInjector.applyProfile = jest.fn().mockResolvedValue([]);
    ConditionFaultInjector.clearAll = jest.fn().mockResolvedValue([]);
    ConditionFaultInjector.injectFailure = jest.fn().mockResolvedValue({});
    ConditionFaultInjector.restoreNode = jest.fn().mockResolvedValue({});
    AuditLog.create = jest.fn().mockResolvedValue({});
    AuditLog.countDocuments = jest.fn().mockResolvedValue(10);
    AuditLog.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            runId: 'RUN-TEST-123',
            action: 'UPLOAD',
            status: 'SUCCESS',
            latencyMs: 45,
            timestamp: new Date(),
          },
        ]),
      }),
    });
    StorageNode.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { nodeId: 'node-1', status: 'HEALTHY' },
        { nodeId: 'node-2', status: 'HEALTHY' },
      ]),
    });
  });

  afterAll(() => {
    config.researchMode = originalResearchMode;
  });

  test('blocks research endpoints when RESEARCH_MODE is false', async () => {
    config.researchMode = false;
    const token = generateToken('admin');

    const res = await request(app)
      .get('/api/research/scenarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('RESEARCH_MODE_DISABLED');
  });

  test('blocks non-admin users from accessing research routes', async () => {
    const token = generateToken('user');

    const res = await request(app)
      .get('/api/research/scenarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('returns available scenarios and workload profiles when authorized', async () => {
    const token = generateToken('admin');

    const scenariosRes = await request(app)
      .get('/api/research/scenarios')
      .set('Authorization', `Bearer ${token}`);

    expect(scenariosRes.status).toBe(200);
    expect(scenariosRes.body.success).toBe(true);
    const scenarioIds = scenariosRes.body.data.scenarios.map(s => s.id);
    expect(scenarioIds).toEqual(
      expect.arrayContaining(['BALANCED', 'HIGH_LATENCY', 'UNEQUAL_LOAD'])
    );

    const profilesRes = await request(app)
      .get('/api/research/workload-profiles')
      .set('Authorization', `Bearer ${token}`);

    expect(profilesRes.status).toBe(200);
    expect(profilesRes.body.success).toBe(true);
    expect(typeof profilesRes.body.data).toBe('object');
    expect(profilesRes.body.data.W1).toBeDefined();
  });

  test('applies and clears fault scenarios', async () => {
    const token = generateToken('admin');

    const applyRes = await request(app)
      .post('/api/research/conditions/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({ scenarioId: 'HIGH_LATENCY' });

    expect(applyRes.status).toBe(200);
    expect(ConditionFaultInjector.applyProfile).toHaveBeenCalledWith(
      [{ nodeId: 'node-1', latency: 200 }],
      'HIGH_LATENCY'
    );

    const clearRes = await request(app)
      .post('/api/research/conditions/clear')
      .set('Authorization', `Bearer ${token}`);

    expect(clearRes.status).toBe(200);
    expect(ConditionFaultInjector.clearAll).toHaveBeenCalled();
  });

  test('returns experiment run status and export records', async () => {
    const token = generateToken('admin');
    const mockRun = {
      runId: 'RUN-TEST-123',
      experimentId: 'EXP-1',
      scenarioId: 'BALANCED',
      strategy: 'ADAPTIVE',
      status: 'COMPLETED',
      summaryMetrics: { totalOperations: 10, totalWrites: 5, totalReads: 5 },
      startTime: new Date(),
      endTime: new Date(),
    };

    ExperimentRun.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockRun),
    });

    const statusRes = await request(app)
      .get('/api/research/experiments/RUN-TEST-123/status')
      .set('Authorization', `Bearer ${token}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.runId).toBe('RUN-TEST-123');
    expect(statusRes.body.data.progress.operationsRecorded).toBe(10);

    const exportRes = await request(app)
      .get('/api/research/experiments/RUN-TEST-123/export')
      .set('Authorization', `Bearer ${token}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-type']).toContain('text/csv');
    expect(exportRes.text).toContain('RUN-TEST-123');
  });
});
