const getNodes = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getNodeDetails = async (req, res) => {
  const { nodeId } = req.params;
  res.json({ success: true, data: { id: nodeId, status: 'active', capacity: '1TB', used: '200GB' } });
};

module.exports = {
  getNodes,
  getNodeDetails
};
