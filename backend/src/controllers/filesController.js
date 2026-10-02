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
    await DownloadCoordinator.download({
      fileId: req.params.fileId,
      userId: req.user.id,
      requestId: req.requestId,
      res,
    });
    // Response already sent by DownloadCoordinator
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
          errors.push(`Node ${nodeId} chunk ${chunk.chunkId}: ${err.message}`);
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
      action: 'DELETE',
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
// STUB ROUTES (to be implemented)
// ─────────────────────────────────────────
const getShared = async (req, res) =>
  res.json({ success: true, data: [], message: 'Sharing not yet implemented' });

const getFavorites = async (req, res) =>
  res.json({ success: true, data: [], message: 'Favorites not yet implemented' });

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

const getExpired = async (req, res) =>
  res.json({ success: true, data: [], message: 'Expired shares not yet implemented' });

module.exports = {
  getFiles,
  getShared,
  getFavorites,
  getRecent,
  getExpired,
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
};

