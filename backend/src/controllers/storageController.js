const StorageNode = require('../models/StorageNode');

const getNodes = async (req, res) => {
  try {
    const nodes = await StorageNode.find();
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNodeDetails = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = await StorageNode.findOne({ nodeId });
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });
    res.json({ success: true, data: node });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerNode = async (req, res) => {
  try {
    const { nodeId, url, capacity } = req.body;
    let node = await StorageNode.findOne({ nodeId });
    if (node) {
      node.url = url;
      node.capacity = capacity;
      node.status = 'HEALTHY';
      node.lastHeartbeat = Date.now();
      await node.save();
    } else {
      node = await StorageNode.create({ nodeId, url, capacity, status: 'HEALTHY' });
    }
    res.json({ success: true, data: node });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const heartbeat = async (req, res) => {
  try {
    const { nodeId, usedSpace, currentLoad, latency } = req.body;
    const node = await StorageNode.findOne({ nodeId });
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });
    
    node.usedSpace = usedSpace || node.usedSpace;
    node.freeSpace = node.capacity - node.usedSpace;
    node.currentLoad = currentLoad || node.currentLoad;
    node.latency = latency || node.latency;
    node.lastHeartbeat = Date.now();
    node.status = 'HEALTHY';
    
    if (node.freeSpace < node.capacity * 0.05) {
      node.status = 'FULL';
    }
    
    await node.save();
    res.json({ success: true, message: 'Heartbeat received' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

class PlacementStrategy {
  static async getTargets(strategy = 'RoundRobin', requiredSpace = 0, replicaCount = 2) {
    const nodes = await StorageNode.find({ status: 'HEALTHY', freeSpace: { $gt: requiredSpace } });
    if (nodes.length < replicaCount) throw new Error('Not enough healthy nodes with sufficient space');
    
    if (strategy === 'PerformanceAware') {
      nodes.sort((a, b) => a.latency - b.latency);
    } else if (strategy === 'Adaptive') {
      nodes.sort((a, b) => (a.currentLoad + a.latency) - (b.currentLoad + b.latency));
    } else {
      // RoundRobin - simple random sort for now
      nodes.sort(() => 0.5 - Math.random());
    }
    
    return nodes.slice(0, replicaCount);
  }
}

module.exports = {
  getNodes,
  getNodeDetails,
  registerNode,
  heartbeat,
  PlacementStrategy
};
