jest.mock('../src/models/File');
jest.mock('../src/models/Chunk');
jest.mock('../src/models/StorageNode');
jest.mock('../src/models/AuditLog');
jest.mock('../src/services/StorageService');

const crypto = require('crypto');
const zlib = require('zlib');
const File = require('../src/models/File');
const Chunk = require('../src/models/Chunk');
const StorageNode = require('../src/models/StorageNode');
const AuditLog = require('../src/models/AuditLog');
const StorageService = require('../src/services/StorageService');
const DownloadCoordinator = require('../src/services/DownloadCoordinator');
const { buildEncryptionInfo, encryptChunk, sha256 } = require('../src/utils/encryption');

describe('DownloadCoordinator streaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AuditLog.create.mockResolvedValue({});
    StorageService.getNodeUrl.mockReturnValue(null);
    StorageService.getNodeUrlFromDB.mockResolvedValue(null);
  });

  test('streams decrypted chunks and verifies the original checksum', async () => {
    const raw = Buffer.from('streamed download payload '.repeat(100));
    const { dataKey, encryptionInfo } = buildEncryptionInfo();
    const encrypted = encryptChunk(raw, dataKey);
    const checksum = sha256(raw);

    File.findOne.mockResolvedValue({
      _id: 'file-1',
      status: 'READY',
      size: raw.length,
      storedSize: raw.length,
      originalSize: raw.length,
      checksum,
      originalSha256: checksum,
      originalFileName: 'payload.txt',
      mimeType: 'text/plain',
      encryptionInfo,
      compressionApplied: false,
    });
    Chunk.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{
        _id: 'chunk-1',
        chunkId: 'file-1_0',
        sequence: 0,
        checksum,
        primaryNode: 'node-1',
        replicaNodes: [],
      }]),
    });
    StorageNode.find.mockResolvedValue([
      { nodeId: 'node-1', status: 'HEALTHY', url: 'http://node-1' },
    ]);
    StorageService.readChunk.mockResolvedValue(encrypted);

    const { stream, contentLength, file } = await DownloadCoordinator.downloadStream({
      fileId: 'file-1',
      userId: 'user-1',
      requestId: 'request-1',
      runId: 'run-1',
    });

    const received = [];
    for await (const part of stream) received.push(Buffer.from(part));
    await new Promise((resolve) => setImmediate(resolve));

    expect(Buffer.concat(received).equals(raw)).toBe(true);
    expect(contentLength).toBe(raw.length);
    expect(file.originalFileName).toBe('payload.txt');
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOWNLOAD', status: 'SUCCESS', runId: 'run-1' })
    );
  });

  test('decompresses stored gzip data before verifying the original checksum', async () => {
    const raw = Buffer.from('compressible download payload '.repeat(200));
    const compressed = zlib.gzipSync(raw);
    const { dataKey, encryptionInfo } = buildEncryptionInfo();
    const encrypted = encryptChunk(compressed, dataKey);
    const checksum = sha256(raw);

    File.findOne.mockResolvedValue({
      _id: 'file-3',
      status: 'READY',
      size: compressed.length,
      storedSize: compressed.length,
      originalSize: raw.length,
      checksum,
      originalSha256: checksum,
      encryptionInfo,
      compressionApplied: true,
    });
    Chunk.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{
        chunkId: 'file-3_0',
        checksum: sha256(compressed),
        primaryNode: 'node-1',
        replicaNodes: [],
      }]),
    });
    StorageNode.find.mockResolvedValue([
      { nodeId: 'node-1', status: 'HEALTHY', url: 'http://node-1' },
    ]);
    StorageService.readChunk.mockResolvedValue(encrypted);

    const { stream, contentLength } = await DownloadCoordinator.downloadStream({
      fileId: 'file-3',
      userId: 'user-1',
      requestId: 'request-3',
    });

    const received = [];
    for await (const part of stream) received.push(Buffer.from(part));
    await new Promise((resolve) => setImmediate(resolve));

    expect(Buffer.concat(received).equals(raw)).toBe(true);
    expect(contentLength).toBe(raw.length);
  });

  test('destroys the stream when an integrity check fails', async () => {
    const raw = Buffer.from('corrupt me');
    const { dataKey, encryptionInfo } = buildEncryptionInfo();
    const encrypted = encryptChunk(raw, dataKey);

    File.findOne.mockResolvedValue({
      _id: 'file-2',
      status: 'READY',
      size: raw.length,
      storedSize: raw.length,
      originalSize: raw.length,
      checksum: sha256(raw),
      originalSha256: '0'.repeat(64),
      encryptionInfo,
      compressionApplied: false,
    });
    Chunk.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{
        chunkId: 'file-2_0',
        checksum: sha256(raw),
        primaryNode: 'node-1',
        replicaNodes: [],
      }]),
    });
    StorageNode.find.mockResolvedValue([
      { nodeId: 'node-1', status: 'HEALTHY', url: 'http://node-1' },
    ]);
    StorageService.readChunk.mockResolvedValue(encrypted);

    const { stream } = await DownloadCoordinator.downloadStream({
      fileId: 'file-2',
      userId: 'user-1',
      requestId: 'request-2',
    });

    await expect((async () => {
      for await (const _ of stream) { /* consume */ }
    })()).rejects.toMatchObject({ code: 'INTEGRITY_CHECK_FAILED' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOWNLOAD', status: 'FAILURE' })
    );
  });

  test('downloads and verifies integrity for multi-chunk 25 MB file (3 chunks: 10MB, 10MB, 5MB)', async () => {
    const chunk0 = crypto.randomBytes(10 * 1024 * 1024);
    const chunk1 = crypto.randomBytes(10 * 1024 * 1024);
    const chunk2 = crypto.randomBytes(5 * 1024 * 1024);
    const fullPayload = Buffer.concat([chunk0, chunk1, chunk2]);
    const fullChecksum = sha256(fullPayload);

    const { dataKey, encryptionInfo } = buildEncryptionInfo();
    const encChunk0 = encryptChunk(chunk0, dataKey);
    const encChunk1 = encryptChunk(chunk1, dataKey);
    const encChunk2 = encryptChunk(chunk2, dataKey);

    File.findOne.mockResolvedValue({
      _id: 'file-25mb',
      status: 'READY',
      size: fullPayload.length,
      storedSize: fullPayload.length,
      originalSize: fullPayload.length,
      checksum: fullChecksum,
      originalSha256: fullChecksum,
      originalFileName: 'incompressible-25mb.bin',
      mimeType: 'application/octet-stream',
      encryptionInfo,
      compressionApplied: false,
    });

    Chunk.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { chunkId: 'file-25mb_0', sequence: 0, checksum: sha256(chunk0), primaryNode: 'node-1', replicaNodes: ['node-2', 'node-3'] },
        { chunkId: 'file-25mb_1', sequence: 1, checksum: sha256(chunk1), primaryNode: 'node-2', replicaNodes: ['node-3', 'node-4'] },
        { chunkId: 'file-25mb_2', sequence: 2, checksum: sha256(chunk2), primaryNode: 'node-3', replicaNodes: ['node-4', 'node-1'] },
      ]),
    });

    StorageNode.find.mockResolvedValue([
      { nodeId: 'node-1', status: 'HEALTHY', url: 'http://node-1' },
      { nodeId: 'node-2', status: 'HEALTHY', url: 'http://node-2' },
      { nodeId: 'node-3', status: 'HEALTHY', url: 'http://node-3' },
      { nodeId: 'node-4', status: 'HEALTHY', url: 'http://node-4' },
    ]);

    StorageService.readChunk.mockImplementation(async (url, chunkId) => {
      if (chunkId === 'file-25mb_0') return encChunk0;
      if (chunkId === 'file-25mb_1') return encChunk1;
      if (chunkId === 'file-25mb_2') return encChunk2;
      throw new Error(`Unknown chunk ${chunkId}`);
    });

    const { stream, contentLength } = await DownloadCoordinator.downloadStream({
      fileId: 'file-25mb',
      userId: 'user-1',
      requestId: 'req-25mb-download',
    });

    const received = [];
    for await (const part of stream) received.push(Buffer.from(part));
    await new Promise((resolve) => setImmediate(resolve));

    const assembled = Buffer.concat(received);
    expect(assembled.length).toBe(25 * 1024 * 1024);
    expect(sha256(assembled)).toBe(fullChecksum);
    expect(contentLength).toBe(25 * 1024 * 1024);
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOWNLOAD', status: 'SUCCESS' })
    );
  });
});
