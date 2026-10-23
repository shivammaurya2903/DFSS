const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

jest.mock('../src/models/File');
jest.mock('../src/models/Chunk');
jest.mock('../src/models/User');
jest.mock('../src/models/AuditLog');
jest.mock('../src/services/StorageService');
jest.mock('../src/placement/PlacementPolicyManager');

const File = require('../src/models/File');
const Chunk = require('../src/models/Chunk');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const StorageService = require('../src/services/StorageService');
const PlacementPolicyManager = require('../src/placement/PlacementPolicyManager');
const UploadCoordinator = require('../src/services/UploadCoordinator');
const config = require('../src/config');

const tempFiles = [];

function makeTempFile(size, extension = '.bin') {
  const filePath = path.join(os.tmpdir(), `dfss-upload-test-${Date.now()}-${Math.random()}${extension}`);
  fs.writeFileSync(filePath, crypto.randomBytes(size));
  tempFiles.push(filePath);
  return {
    path: filePath,
    size,
    originalname: `test${extension}`,
    mimetype: 'application/octet-stream',
  };
}

describe('UploadCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    File.create.mockImplementation(async (doc) => ({ ...doc, _id: 'file-id' }));
    File.findByIdAndUpdate.mockImplementation(async (id, update) => ({
      _id: id,
      ...update,
    }));
    Chunk.create.mockImplementation(async (doc) => ({ ...doc, _id: `chunk-${doc.sequence}` }));
    User.findOneAndUpdate.mockResolvedValue({ _id: 'user-id' });
    User.findByIdAndUpdate.mockResolvedValue({});
    AuditLog.create.mockResolvedValue({});
    StorageService.writeChunk.mockResolvedValue({ success: true });
    StorageService.deleteChunk.mockResolvedValue({ success: true });
    PlacementPolicyManager.place.mockResolvedValue({
      primary: { nodeId: 'node-1', url: 'http://node-1' },
      replicas: [{ nodeId: 'node-2', url: 'http://node-2' }],
    });
  });

  afterAll(() => {
    for (const file of tempFiles) {
      try { fs.unlinkSync(file); } catch (_) { /* ignore */ }
    }
  });

  test('stores a multi-chunk file with a checksum of the encrypted payload', async () => {
    const chunkSize = config.chunkSizeBytes;
    const fileData = makeTempFile(chunkSize + 2 * 1024 * 1024);

    const result = await UploadCoordinator.upload({
      fileData,
      userId: 'user-id',
      requestId: 'request-id',
      placementPolicy: 'ADAPTIVE',
      runId: 'run-1',
      scenarioId: 'UNEQUAL_LOAD',
    });

    expect(result.file.chunkCount).toBe(2);
    expect(Chunk.create).toHaveBeenCalledTimes(2);
    expect(StorageService.writeChunk).toHaveBeenCalledTimes(4);
    expect(Chunk.create.mock.calls[0][0].checksum).not.toBe(
      StorageService.writeChunk.mock.calls[0][3]
    );
    expect(StorageService.writeChunk.mock.calls[0][3]).toBe(
      crypto.createHash('sha256').update(StorageService.writeChunk.mock.calls[0][2]).digest('hex')
    );
    expect(File.findByIdAndUpdate).toHaveBeenCalledWith(
      'file-id',
      expect.objectContaining({
        encryptionInfo: expect.objectContaining({
          keyVersion: 2,
          wrappedKey: expect.any(String),
        }),
      })
    );
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ runId: 'run-1', scenarioId: 'UNEQUAL_LOAD' })
    );
  });

  test('rejects oversized originals with HTTP 413 and leaves no files', async () => {
    const originalLimit = config.maxOriginalFileSize;
    config.maxOriginalFileSize = 1024;
    const fileData = makeTempFile(2048);

    try {
      await expect(UploadCoordinator.upload({
        fileData,
        userId: 'user-id',
        requestId: 'request-id',
      })).rejects.toMatchObject({
        code: 'ORIGINAL_FILE_LIMIT_EXCEEDED',
        statusCode: 413,
      });
      expect(fs.existsSync(fileData.path)).toBe(false);
      expect(StorageService.writeChunk).not.toHaveBeenCalled();
    } finally {
      config.maxOriginalFileSize = originalLimit;
    }
  });
});
