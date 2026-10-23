const File = require('../models/File');
const ShareToken = require('../models/ShareToken');
const Chunk = require('../models/Chunk');
const AuditLog = require('../models/AuditLog');
const StorageService = require('../services/StorageService');
const StorageNode = require('../models/StorageNode');
const UploadCoordinator = require('../services/UploadCoordinator');
const DownloadCoordinator = require('../services/DownloadCoordinator');

/**
 * FilesController
 *
 * Thin controller layer — delegates all business logic to coordinators/services.
 * Responsible only for: HTTP request parsing, response formatting, error handling.
 */

// ─────────────────────────────────────────
// LIST FILES
// ─────────────────────────────────────────
const getFiles = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user.id })
      .select('-chunks')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: files });
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
const downloadFile = async (req, res, next) => {
  try {
    const { fullBuffer, file } = await DownloadCoordinator.download({
      fileId: req.params.fileId,
      userId: req.user.id,
      requestId: req.requestId,
      res,
    });
    const finalName = file.originalFileName || file.originalName || file.filename;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalName)}"`);
    res.setHeader('Content-Type', file.originalMimeType || file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fullBuffer.length);
    res.send(fullBuffer);
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    }
  }
};

// ─────────────────────────────────────────
// VIEW FILE
// ─────────────────────────────────────────
const viewFile = async (req, res, next) => {
  try {
    const { fullBuffer, file } = await DownloadCoordinator.download({
      fileId: req.params.fileId,
      userId: req.user.id,
      requestId: req.requestId,
      res,
    });
    const finalName = file.originalFileName || file.originalName || file.filename;
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(finalName)}"`);
    let mime = file.originalMimeType || file.mimeType;
    if (!mime || mime === 'application/octet-stream') {
      // Fallback if genuinely unknown, though instructions say "Never return application/octet-stream for view unless it's genuinely unknown."
      mime = 'application/octet-stream';
    }
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', fullBuffer.length);
    res.send(fullBuffer);
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    }
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
    }).catch(() => {});

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
const createShare = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    const { token, tokenHash } = ShareToken.generateToken();
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
      expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
    } else if (req.body.expiresInDays) {
      expiresAt.setDate(expiresAt.getDate() + req.body.expiresInDays);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const share = await ShareToken.create({
      fileId: file._id,
      ownerId: req.user.id,
      tokenHash,
      expiresAt,
      permission: req.body.permission || 'viewer',
      sharedWithEmail: req.body.email || null,
    });

    const host = req.headers.host || 'localhost';
    const protocol = req.secure ? 'https' : 'http';
    const shareUrl = `${protocol}://${host}/shared/${token}`;

    res.status(201).json({
      success: true,
      data: {
        shareId: share._id,
        _id: share._id,
        token,
        tokenHash,
        shareUrl,
        expiresAt,
        createdAt: share.createdAt,
        file: {
          _id: file._id,
          filename: file.originalFileName || file.originalName || file.filename,
          originalName: file.originalFileName || file.originalName || file.filename,
          mimeType: file.originalMimeType || file.mimeType,
          size: file.size,
          storedSize: file.storedSize || file.size,
        },
        fileName: file.originalFileName || file.originalName || file.filename,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getFileShares = async (req, res, next) => {
  try {
    const shares = await ShareToken.find({ fileId: req.params.fileId, ownerId: req.user.id });
    res.json({ success: true, data: shares });
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

    const file = await File.findById(share.fileId).select('-chunks');
    if (!file) {
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
    }

    res.json({ success: true, data: file });
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

    const { fullBuffer, file } = await DownloadCoordinator.download({
      fileId: share.fileId,
      userId: fileMeta.owner,
      requestId: req.requestId,
      res,
    });
    
    const finalName = file.originalFileName || file.originalName || file.filename;
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(finalName)}"`);
    let mime = file.originalMimeType || file.mimeType;
    if (!mime || mime === 'application/octet-stream') {
      mime = 'application/octet-stream';
    }
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', fullBuffer.length);
    res.send(fullBuffer);
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

    const { fullBuffer, file } = await DownloadCoordinator.download({
      fileId: share.fileId,
      userId: fileMeta.owner,
      requestId: req.requestId,
      res,
    });

    const finalName = file.originalFileName || file.originalName || file.filename;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalName)}"`);
    res.setHeader('Content-Type', file.originalMimeType || file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fullBuffer.length);
    res.send(fullBuffer);
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
      expiresAt: { $gt: now }
    }).populate('fileId');

    const mapped = shares
      .filter(s => s.fileId != null)
      .map(share => ({
        shareId: share._id,
        _id: share._id,
        file: share.fileId,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
        sharedWithEmail: share.sharedWithEmail,
        permission: share.permission,
      }));
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
      .map(share => ({
        shareId: share._id,
        _id: share._id,
        file: share.fileId,
        expiresAt: share.expiresAt,
        revokedAt: share.revokedAt,
        createdAt: share.createdAt,
        isRevoked: !!share.revokedAt,
        isExpired: share.expiresAt ? new Date(share.expiresAt) <= now : false
      }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFiles,
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

