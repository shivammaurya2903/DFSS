const StorageNode = require('../models/StorageNode');
const AuditLog = require('../models/AuditLog');
const config = require('../config');

// ─────────────────────────────────────────
// LIST NODES
// ─────────────────────────────────────────
const getNodes = async (req, res, next) => {
  try {
    const nodes = await StorageNode.find().select('-injectedConditions');
    res.json({ success: true, data: nodes });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// GET NODE DETAILS
// ─────────────────────────────────────────
const getNodeDetails = async (req, res, next) => {
  try {
    const node = await StorageNode.findOne({ nodeId: req.params.nodeId });
    if (!node) {
      return res.status(404).json({ success: false, code: 'NODE_NOT_FOUND', message: 'Node not found' });
    }
    res.json({ success: true, data: node });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// REGISTER / RE-REGISTER NODE
// Called by storage nodes on startup.
// Protected by INTERNAL_API_SECRET.
// ─────────────────────────────────────────
const registerNode = async (req, res, next) => {
  try {
    const { nodeId, url, capacity, failureDomainId = 'LOCAL-HDD', securityCapabilities } = req.body;

    if (!nodeId || !url) {
      return res.status(400).json({ success: false, message: 'nodeId and url are required' });
    }

    let node = await StorageNode.findOne({ nodeId });
    if (node) {
      node.url = url;
      node.capacity = capacity || node.capacity;
      node.freeSpace = (capacity || node.capacity) - (node.usedSpace || 0);
      node.status = 'HEALTHY';
      node.lastHeartbeat = new Date();
      node.failureDomainId = failureDomainId;
      if (securityCapabilities) node.securityCapabilities = securityCapabilities;
      await node.save();
    } else {
      node = await StorageNode.create({
        nodeId,
        url,
        capacity: capacity || 0,
        freeSpace: capacity || 0,
        status: 'HEALTHY',
        lastHeartbeat: new Date(),
        failureDomainId,
        securityCapabilities: securityCapabilities || ['PUBLIC', 'PRIVATE', 'SENSITIVE'],
      });
    }

    console.log(`[StorageController] Node registered/updated: ${nodeId} at ${url}`);
    res.json({ success: true, data: node });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// HEARTBEAT
// Called by storage nodes periodically.
// Protected by INTERNAL_API_SECRET.
// ─────────────────────────────────────────
const heartbeat = async (req, res, next) => {
  try {
    const { nodeId, usedSpace, availableSpace, totalSpace, currentLoad, latency, activeRequests, chunkCount, replicaCount } = req.body;

    if (!nodeId) {
      return res.status(400).json({ success: false, message: 'nodeId is required' });
    }

    const node = await StorageNode.findOne({ nodeId });
    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found — please register first' });
    }

    // Update real metrics from heartbeat
    if (totalSpace !== undefined)    node.capacity   = totalSpace;
    if (usedSpace !== undefined)     node.usedSpace  = usedSpace;
    if (availableSpace !== undefined) node.freeSpace  = availableSpace;
    if (currentLoad !== undefined)   node.currentLoad = currentLoad;
    if (latency !== undefined)       node.latency    = latency;
    if (activeRequests !== undefined) node.activeRequests = activeRequests;
    if (chunkCount !== undefined)    node.chunkCount = chunkCount;
    if (replicaCount !== undefined)  node.replicaCount = replicaCount;

    node.lastHeartbeat = new Date();

    // Determine status based on real metrics (unless condition is injected)
    if (!node.injectedConditions?.active) {
      const utilizationPct = node.capacity > 0 ? node.usedSpace / node.capacity : 0;
      if (utilizationPct >= 0.98) {
        node.status = 'FULL';
      } else if (utilizationPct >= 0.90 || (node.currentLoad || 0) > 0.95) {
        node.status = 'DEGRADED';
      } else {
        node.status = 'HEALTHY';
      }
    }

    await node.save();
    res.json({ success: true, message: 'Heartbeat received', nodeId, status: node.status });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────
// ADMIN: AGGREGATE METRICS
// ─────────────────────────────────────────
const getSystemMetrics = async (req, res, next) => {
  try {
    const nodes = await StorageNode.find();
    const totalCapacity = nodes.reduce((s, n) => s + (n.capacity || 0), 0);
    const totalUsed = nodes.reduce((s, n) => s + (n.usedSpace || 0), 0);
    const totalChunks = nodes.reduce((s, n) => s + (n.chunkCount || 0), 0);
    const healthyCnt = nodes.filter(n => n.status === 'HEALTHY').length;
    const offlineCnt = nodes.filter(n => n.status === 'OFFLINE').length;
    const avgLoad = nodes.length > 0
      ? nodes.reduce((s, n) => s + (n.currentLoad || 0), 0) / nodes.length
      : 0;

    res.json({
      success: true,
      data: {
        totalNodes: nodes.length,
        healthyNodes: healthyCnt,
        offlineNodes: offlineCnt,
        totalCapacityBytes: totalCapacity,
        totalUsedBytes: totalUsed,
        totalFreeBytes: totalCapacity - totalUsed,
        utilizationPercent: totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(2) : 0,
        totalChunks,
        averageLoad: avgLoad.toFixed(4),
        nodes: nodes.map(n => ({
          nodeId: n.nodeId,
          status: n.status,
          capacityBytes: n.capacity,
          usedBytes: n.usedSpace,
          freeBytes: n.freeSpace,
          currentLoad: n.currentLoad,
          latencyMs: n.latency,
          chunkCount: n.chunkCount,
          replicaCount: n.replicaCount,
          failureDomainId: n.failureDomainId,
          lastHeartbeat: n.lastHeartbeat,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPlacementDebug = async (req, res, next) => {
  try {
    const nodes = await StorageNode.find();
    res.json({
      success: true,
      data: {
        totalNodes: nodes.length,
        eligibleCount: nodes.filter(n => n.status === 'HEALTHY').length,
        nodes: nodes.map(n => ({
          nodeId: n.nodeId,
          status: n.status,
          capacity: n.capacity,
          freeSpace: n.freeSpace,
          failureDomainId: n.failureDomainId,
          securityCapabilities: n.securityCapabilities,
          lastHeartbeat: n.lastHeartbeat,
        })),
        config: {
          weights: require('../config').placementWeights,
          replicationFactor: require('../config').replicationFactor,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNodes,
  getNodeDetails,
  registerNode,
  heartbeat,
  getSystemMetrics,
  getPlacementDebug,
};
