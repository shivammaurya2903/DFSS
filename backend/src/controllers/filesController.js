const File = require('../models/File');
const ShareToken = require('../models/ShareToken');
const Chunk = require('../models/Chunk');
const AuditLog = require('../models/AuditLog');
const StorageService = require('../services/StorageService');
const StorageNode = require('../models/StorageNode');
const UploadCoordinator = require('../services/UploadCoordinator');
const DownloadCoordinator = require('../services/DownloadCoordinator');
const config = require('../config');

/**
 * FilesController
 *
 * Thin controller layer — delegates all business logic to coordinators/services.
 * Responsible only for: HTTP request parsing, response formatting, error handling.
 */

// ─────────────────────────────────────────
// LIST FILES
// ─────────────────────────────────────────
const getUploadLimits = async (req, res) => {
  res.json({
    success: true,
    data: {
      maxOriginalFileSize: config.maxOriginalFileSize,
      maxStoredFileSize: config.maxStoredFileSize,
      maxOriginalFileSizeMB: Math.floor(config.maxOriginalFileSize / (1024 * 1024)),
      maxStoredFileSizeMB: Math.floor(config.maxStoredFileSize / (1024 * 1024)),
      chunkSize: config.chunkSizeBytes,
      defaultStorageQuota: config.defaultStorageQuota,
      replicationFactor: config.replicationFactor,
    },
  });
};

const getFiles = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
    const filter = {
      owner: req.user.id,
      status: { $in: ['READY', 'DEGRADED'] },
    };

    if (req.query.search) {
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { filename: { $regex: escaped, $options: 'i' } },
        { originalName: { $regex: escaped, $options: 'i' } },
        { originalFileName: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [files, total] = await Promise.all([
      File.find(filter)
        .select('-chunks')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      File.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: files,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// UPLOAD FILE
// ─────────────────────────────────────────
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, code: 'INVALID_FILE', message: 'No file provided' });
    }

    // debug removed

    const result = await UploadCoordinator.upload({
      fileData: req.file,
      userId: req.user.id || req.user.userId,
      requestId: req.requestId,
      sensitivity: req.body.sensitivity || 'PRIVATE',
      securityClass: req.body.securityClass || 'MEDIUM',
      placementPolicy: req.body.placementPolicy || 'ADAPTIVE',
      runId: req.body.runId || null,
      scenarioId: req.body.scenarioId || null,
    });

    res.status(201).json({
      success: true,
      data: result.file,
      timings: result.timings,
    });
  } catch (err) {

    next(err);
  }
};

// ─────────────────────────────────────────
// GET FILE DETAILS
// ─────────────────────────────────────────
const getFileDetails = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      owner: req.user.id,
    }).populate('chunks');

    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    res.json({ success: true, data: file });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// DOWNLOAD FILE
// ─────────────────────────────────────────
async function streamFileResponse(req, res, next, { fileId, userId, disposition }) {
  const { file, stream, contentLength } = await DownloadCoordinator.downloadStream({
    fileId,
    userId,
    requestId: req.requestId,
  });

  const finalName = file.originalFileName || file.originalName || file.filename;
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(finalName)}"`);
  res.setHeader('Content-Type', file.originalMimeType || file.mimeType || 'application/octet-stream');
  if (contentLength) {
    res.setHeader('Content-Length', contentLength);
  }

  stream.on('error', (err) => {
    if (!res.headersSent) next(err);
    else res.destroy(err);
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

const downloadFile = async (req, res, next) => {
  try {
    await streamFileResponse(req, res, next, {
      fileId: req.params.fileId,
      userId: req.user.id,
      disposition: 'attachment',
    });
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};

// ─────────────────────────────────────────
// VIEW FILE
// ─────────────────────────────────────────
const viewFile = async (req, res, next) => {
  try {
    await streamFileResponse(req, res, next, {
      fileId: req.params.fileId,
      userId: req.user.id,
      disposition: 'inline',
    });
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};

// ─────────────────────────────────────────
// DELETE FILE
// ─────────────────────────────────────────
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      owner: req.user.id,
    }).populate('chunks');

    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    // Delete chunks from all storage nodes
    const errors = [];
    for (const chunk of file.chunks) {
      const allNodeIds = [chunk.primaryNode, ...(chunk.replicaNodes || [])];
      for (const nodeId of allNodeIds) {
        try {
          const url = StorageService.getNodeUrl(nodeId) ||
                      await StorageService.getNodeUrlFromDB(nodeId);
          if (url) {
            await StorageService.deleteChunk(url, chunk.chunkId);
          }
        } catch (err) {
          const is404 = err.response && err.response.status === 404;
          if (!is404) {
            errors.push(`Node ${nodeId} chunk ${chunk.chunkId}: ${err.message}`);
          }
        }
      }
      await Chunk.findByIdAndDelete(chunk._id);
    }

    await File.findByIdAndDelete(file._id);

    // Delete share tokens
    await ShareToken.deleteMany({ fileId: file._id });

    // Release Quota
    const User = require('../models/User');
    const storedSize = file.storedSize || file.size;
    await User.findByIdAndUpdate(req.user.id, { $inc: { usedStorage: -storedSize } });

    // Audit log
    await AuditLog.create({
      requestId: req.requestId,
      userId: req.user.id,
      action: 'FILE_DELETED',
      status: errors.length === 0 ? 'SUCCESS' : 'FAILURE',
      fileId: file._id,
      reason: errors.length > 0 ? errors.join('; ') : undefined,
      metadata: { filename: file.originalFileName || file.originalName || file.filename },
    });

    res.json({
      success: true,
      message: 'File deleted successfully',
      ...(errors.length > 0 && { warnings: errors }),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// SHARING
// ─────────────────────────────────────────
const shareUrlFor = (token) => `${config.frontendUrl.replace(/\/$/, '')}/shared/${token}`;

const serializeShare = (share, file = null) => {
  const now = new Date();
  const token = ShareToken.getTokenForShare(share);
  const revoked = Boolean(share.revokedAt);
  const expired = share.expiresAt ? new Date(share.expiresAt) <= now : false;
  const fileName = file
    ? (file.originalFileName || file.originalName || file.filename)
    : null;

  return {
    shareId: share._id,
    _id: share._id,
    file: file || share.fileId,
    fileName,
    token,
    shareUrl: token ? shareUrlFor(token) : null,
    linkAvailable: Boolean(token),
    expiresAt: share.expiresAt,
    createdAt: share.createdAt,
    revokedAt: share.revokedAt,
    sharedWithEmail: share.sharedWithEmail,
    permission: share.permission,
    isExpired: expired,
    isRevoked: revoked,
    status: revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE'),
  };
};

const createShare = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }
    if (!['READY', 'DEGRADED'].includes(file.status)) {
      return res.status(409).json({ success: false, code: 'FILE_NOT_READY', message: 'File is not ready to share' });
    }

    let expiresAt = new Date();
    const exp = req.body.expiresIn;
    
    if (exp === '1h') {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (exp === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (exp === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (exp === '30d') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (exp === 'never') {
      expiresAt = null;
    } else if (req.body.expiresInDays) {
      expiresAt.setDate(expiresAt.getDate() + Number(req.body.expiresInDays));
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const share = new ShareToken({
      fileId: file._id,
      ownerId: req.user.id,
      tokenHash: `pending-${Date.now()}-${Math.random()}`,
      expiresAt,
      permission: req.body.permission || 'viewer',
      sharedWithEmail: req.body.email || null,
    });

    const token = ShareToken.deriveToken(share._id);
    share.tokenHash = ShareToken.hashToken(token);
    await share.save();

    res.status(201).json({
      success: true,
      data: serializeShare(share, file),
    });
  } catch (err) {
    next(err);
  }
};

const getFileShares = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id })
      .select('originalName originalFileName filename mimeType originalMimeType size storedSize');
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    const shares = await ShareToken.find({
      fileId: req.params.fileId,
      ownerId: req.user.id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: shares.map(share => serializeShare(share, file)) });
  } catch (err) {
    next(err);
  }
};

const revokeShare = async (req, res, next) => {
  try {
    const param = req.params.shareId;
    let share;
    
    // Check if param is a valid ObjectId (24 hex chars)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    
    if (isObjectId) {
      share = await ShareToken.findOne({ _id: param, fileId: req.params.fileId, ownerId: req.user.id });
    } else {
      // Treat as token - hash it and look up
      const tokenHash = ShareToken.hashToken(param);
      share = await ShareToken.findOne({ tokenHash, fileId: req.params.fileId, ownerId: req.user.id });
    }
    
    if (!share) {
      return res.status(404).json({ success: false, code: 'SHARE_NOT_FOUND', message: 'Share token not found' });
    }
    share.revokedAt = new Date();
    await share.save();
    res.json({ success: true, message: 'Share revoked successfully' });
  } catch (err) {
    next(err);
  }
};

const getSharedFile = async (req, res, next) => {
  try {
    const token = req.params.token;
    const tokenHash = ShareToken.hashToken(token);
    const share = await ShareToken.findOne({ tokenHash });
    if (!share || !share.isValid()) {
      return res.status(403).json({ success: false, code: 'INVALID_SHARE', message: 'Invalid or expired share link' });
    }

    const file = await File.findOne({ _id: share.fileId, status: { $in: ['READY', 'DEGRADED'] } })
      .select('filename originalName originalFileName mimeType originalMimeType size originalSize storedSize compressionApplied status createdAt');
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    res.json({
      success: true,
      data: {
        _id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        originalMimeType: file.originalMimeType,
        size: file.size,
        originalSize: file.originalSize,
        storedSize: file.storedSize,
        compressionApplied: file.compressionApplied,
        status: file.status,
        createdAt: file.createdAt,
        expiresAt: share.expiresAt,
        permission: share.permission,
        sharedAt: share.createdAt,
      },
      share: {
        expiresAt: share.expiresAt,
        permission: share.permission,
        createdAt: share.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const viewSharedFile = async (req, res, next) => {
  try {
    const token = req.params.token;
    const tokenHash = ShareToken.hashToken(token);
    const share = await ShareToken.findOne({ tokenHash });
    if (!share || !share.isValid()) {
      return res.status(403).json({ success: false, code: 'INVALID_SHARE', message: 'Invalid or expired share link' });
    }

    const fileMeta = await File.findById(share.fileId);
    if (!fileMeta) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    await streamFileResponse(req, res, next, {
      fileId: share.fileId,
      userId: fileMeta.owner,
      disposition: 'inline',
    });
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    }
  }
};

const downloadSharedFile = async (req, res, next) => {
  try {
    const token = req.params.token;
    const tokenHash = ShareToken.hashToken(token);
    const share = await ShareToken.findOne({ tokenHash });
    if (!share || !share.isValid()) {
      return res.status(403).json({ success: false, code: 'INVALID_SHARE', message: 'Invalid or expired share link' });
    }

    const fileMeta = await File.findById(share.fileId);
    if (!fileMeta) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    await streamFileResponse(req, res, next, {
      fileId: share.fileId,
      userId: fileMeta.owner,
      disposition: 'attachment',
    });
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    }
  }
};

// ─────────────────────────────────────────
// SHARED, FAVORITES, RECENT & EXPIRED
// ─────────────────────────────────────────
const getShared = async (req, res, next) => {
  try {
    const now = new Date();
    const shares = await ShareToken.find({
      ownerId: req.user.id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).populate('fileId');

    const mapped = shares
      .filter(s => s.fileId != null)
      .map(share => serializeShare(share, share.fileId));
    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user.id, status: 'READY', isFavorite: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: files });
  } catch (err) {
    next(err);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }
    file.isFavorite = !file.isFavorite;
    await file.save();
    res.json({ success: true, data: file });
  } catch (err) {
    next(err);
  }
};

const getRecent = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id, status: 'READY' })
      .select('-chunks')
      .sort({ updatedAt: -1 })
      .limit(10);
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getExpired = async (req, res, next) => {
  try {
    const now = new Date();
    const expiredShares = await ShareToken.find({
      ownerId: req.user.id,
      $or: [
        { revokedAt: { $ne: null } },
        { expiresAt: { $lte: now } }
      ]
    }).populate('fileId').sort({ updatedAt: -1 });

    const mapped = expiredShares
      .filter(s => s.fileId != null)
      .map(share => serializeShare(share, share.fileId));

    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFiles,
  getUploadLimits,
  getShared,
  getFavorites,
  toggleFavorite,
  getRecent,
  getExpired,
  uploadFile,
  getFileDetails,
  viewFile,
  downloadFile,
  deleteFile,
  createShare,
  getFileShares,
  revokeShare,
  getSharedFile,
  viewSharedFile,
  downloadSharedFile,
};

