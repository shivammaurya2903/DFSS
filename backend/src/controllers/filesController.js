const getFiles = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getShared = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getFavorites = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getRecent = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getExpired = async (req, res) => {
  res.json({ success: true, data: [] });
};

module.exports = {
  getFiles,
  getShared,
  getFavorites,
  getRecent,
  getExpired
};
