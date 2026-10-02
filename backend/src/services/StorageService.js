const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

/**
 * StorageService — Storage Abstraction Layer
 *
 * All business logic communicates with storage nodes through this service.
 * Business logic never directly depends on node URLs or HTTP transport details.
 *
 * Currently implements: LocalHDD via storage-node HTTP APIs.
 * Future adapters: MinIO, external SSD, cloud storage.
 */

const StorageService = {
  /**
   * Write a chunk to a storage node.
   *
   * @param {string} nodeUrl   - Storage node base URL (e.g., http://localhost:5001)
   * @param {string} chunkId   - Unique chunk identifier
   * @param {Buffer} data      - Encrypted chunk data
   * @param {string} checksum  - SHA-256 checksum of raw (pre-encryption) chunk data
   * @returns {Promise<{success: boolean, chunkId: string}>}
   */
  async writeChunk(nodeUrl, chunkId, data, checksum) {
    const form = new FormData();
    form.append('chunkId', chunkId);
    form.append('checksum', checksum);
    form.append('chunk', data, {
      filename: chunkId,
      contentType: 'application/octet-stream',
    });

    try {
      const response = await axios.post(`${nodeUrl}/internal/chunks`, form, {
        headers: {
          ...form.getHeaders(),
          'x-chunk-id': chunkId,
          'x-checksum': checksum,
        },
        timeout: config.storageUploadTimeoutMs,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (err) {
      if (err.response) {
        throw new Error(`Storage node responded with ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      }
      throw err;
    }
  },

  /**
   * Read a chunk from a storage node.
   *
   * @param {string} nodeUrl  - Storage node base URL
   * @param {string} chunkId  - Chunk identifier
   * @returns {Promise<Buffer>} - Raw chunk data (encrypted)
   */
  async readChunk(nodeUrl, chunkId) {
    const response = await axios.get(`${nodeUrl}/internal/chunks/${encodeURIComponent(chunkId)}`, {
      responseType: 'arraybuffer',
      timeout: config.storageRequestTimeoutMs,
    });
    return Buffer.from(response.data);
  },

  /**
   * Check whether a chunk exists on a storage node (without downloading it).
   *
   * @param {string} nodeUrl
   * @param {string} chunkId
   * @returns {Promise<boolean>}
   */
  async chunkExists(nodeUrl, chunkId) {
    try {
      await axios.head(`${nodeUrl}/internal/chunks/${encodeURIComponent(chunkId)}`, {
        timeout: config.storageHealthTimeoutMs,
      });
      return true;
    } catch (err) {
      if (err.response && err.response.status === 404) return false;
      throw err;
    }
  },

  /**
   * Delete a chunk from a storage node.
   *
   * @param {string} nodeUrl
   * @param {string} chunkId
   * @returns {Promise<{success: boolean}>}
   */
  async deleteChunk(nodeUrl, chunkId) {
    const response = await axios.delete(
      `${nodeUrl}/internal/chunks/${encodeURIComponent(chunkId)}`,
      { timeout: config.storageRequestTimeoutMs }
    );
    return response.data;
  },

  /**
   * Get health status from a storage node.
   *
   * @param {string} nodeUrl
   * @returns {Promise<object>} - { nodeId, status, ... }
   */
  async getNodeHealth(nodeUrl) {
    const response = await axios.get(`${nodeUrl}/internal/health`, {
      timeout: config.storageHealthTimeoutMs,
    });
    return response.data;
  },

  /**
   * Get metrics from a storage node.
   *
   * @param {string} nodeUrl
   * @returns {Promise<object>}
   */
  async getNodeMetrics(nodeUrl) {
    const response = await axios.get(`${nodeUrl}/internal/metrics`, {
      timeout: config.storageHealthTimeoutMs,
    });
    return response.data;
  },

  /**
   * Look up the URL for a given nodeId from the config registry.
   * Falls back to DB lookup via StorageNode model if not in config.
   *
   * @param {string} nodeId
   * @returns {string|null}
   */
  getNodeUrl(nodeId) {
    // Map: node-1 → STORAGE_NODE_1_URL, node-2 → STORAGE_NODE_2_URL, etc.
    const index = parseInt(nodeId.replace(/\D/g, ''), 10);
    if (index >= 1 && index <= 4) {
      const url = process.env[`STORAGE_NODE_${index}_URL`];
      if (url) return url;
    }
    return null;
  },

  /**
   * Get a node URL from the DB record (most reliable — works for any number of nodes).
   * Should be used when getNodeUrl() returns null.
   */
  async getNodeUrlFromDB(nodeId) {
    const StorageNode = require('../models/StorageNode');
    const node = await StorageNode.findOne({ nodeId });
    return node ? node.url : null;
  },
};

module.exports = StorageService;
