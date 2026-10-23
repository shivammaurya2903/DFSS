const crypto = require('crypto');

jest.mock('../src/models/Chunk');
jest.mock('../src/models/File');
jest.mock('../src/models/StorageNode');
jest.mock('../src/models/AuditLog');
jest.mock('../src/services/StorageService');

const Chunk = require('../src/models/Chunk');
const File = require('../src/models/File');
const StorageNode = require('../src/models/StorageNode');
const AuditLog = require('../src/models/AuditLog');
const StorageService = require('../src/services/StorageService');
const RecoveryManager = require('../src/recovery/RecoveryManager');
const { getLegacyKey, encryptChunk, sha256 } = require('../src/utils/encryption');

const plaintext = Buffer.from('a chunk that must survive primary failure');
const encrypted = encryptChunk(plaintext, getLegacyKey());

function buildChunk(overrides = {}) {
  return {
    _id: 'chunk-doc-id',
    chunkId: 'file-id_0',
    fileId: 'file-id',
    primaryNode: 'node-1',
    replicaNodes: ['node-2'],
    checksum: sha256(plaintext),
    size: plaintext.length,
    status: 'VERIFIED',
    ...overrides,
  };
}

describe('RecoveryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Chunk.findByIdAndUpdate.mockResolvedValue({});
    Chunk.countDocuments.mockResolvedValue(0);
    File.updateMany.mockResolvedValue({});
    File.findById.mockResolvedValue({ _id: 'file-id', encryptionInfo: {} });
    File.findByIdAndUpdate.mockResolvedValue({});
    StorageService.readChunk.mockResolvedValue(encrypted);
    StorageService.writeChunk.mockResolvedValue({ success: true });
    AuditLog.create.mockResolvedValue({});
    StorageNode.findOne.mockResolvedValue({
      nodeId: 'node-2',
      status: 'HEALTHY',
      url: 'http://node-2',
    });
    StorageNode.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { nodeId: 'node-3', status: 'HEALTHY', url: 'http://node-3' },
      ]),
    });
  });

  test('replaces a failed primary using the encrypted payload checksum', async () => {
    const chunk = buildChunk();
    Chunk.find.mockResolvedValue([chunk]);

    const result = await RecoveryManager.handleNodeFailure('node-1');

    expect(result).toMatchObject({ affectedChunks: 1, recoveredCount: 1, failedCount: 0 });
    expect(StorageService.writeChunk).toHaveBeenCalledTimes(1);
    expect(StorageService.writeChunk).toHaveBeenCalledWith(
      'http://node-3',
      chunk.chunkId,
      encrypted,
      sha256(encrypted)
    );
    expect(StorageService.writeChunk.mock.calls[0][3]).not.toBe(chunk.checksum);

    expect(Chunk.findByIdAndUpdate).toHaveBeenCalledWith(
      chunk._id,
      expect.objectContaining({
        primaryNode: 'node-2',
        status: 'VERIFIED',
        replicaNodes: expect.arrayContaining(['node-3']),
      })
    );
    expect(File.findByIdAndUpdate).toHaveBeenCalledWith('file-id', { status: 'READY' });
  });

  test('does not write a corrupt source and marks the chunk FAILED', async () => {
    const chunk = buildChunk();
    Chunk.find.mockResolvedValue([chunk]);
    Chunk.countDocuments.mockResolvedValue(1);
    StorageService.readChunk.mockResolvedValue(crypto.randomBytes(64));

    const result = await RecoveryManager.handleNodeFailure('node-1');

    expect(result).toMatchObject({ recoveredCount: 0, failedCount: 1 });
    expect(StorageService.writeChunk).not.toHaveBeenCalled();
    expect(Chunk.findByIdAndUpdate).toHaveBeenCalledWith(chunk._id, { status: 'FAILED' });
    expect(File.findByIdAndUpdate).toHaveBeenCalledWith('file-id', { status: 'DEGRADED' });
  });
});
