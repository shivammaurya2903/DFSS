const request = require('supertest');
const express = require('express');
const { getNodes, registerNode } = require('../src/controllers/storageController');
const StorageNode = require('../src/models/StorageNode');
const mongoose = require('mongoose');

// Mock express app
const app = express();
app.use(express.json());
app.post('/api/storage/register', registerNode);
app.get('/api/storage/nodes', getNodes);

jest.mock('../src/models/StorageNode');

describe('Storage Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register a new storage node', async () => {
    StorageNode.findOne.mockResolvedValue(null);
    StorageNode.create.mockResolvedValue({
      nodeId: 'node-1',
      url: 'http://localhost:8001',
      capacity: 1000,
      status: 'HEALTHY'
    });

    const res = await request(app)
      .post('/api/storage/register')
      .send({ nodeId: 'node-1', url: 'http://localhost:8001', capacity: 1000 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nodeId).toBe('node-1');
  });

  test('should return list of nodes', async () => {
    StorageNode.find.mockReturnValue({ select: jest.fn().mockResolvedValue([
      { nodeId: 'node-1', status: 'HEALTHY' }
    ]) });

    const res = await request(app).get('/api/storage/nodes');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });
});

