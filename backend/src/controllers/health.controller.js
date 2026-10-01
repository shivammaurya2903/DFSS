function getHealth(req, res) {
  res.json({
    success: true,
    service: "distributed-file-storage-backend",
    status: "healthy",
  });
}

module.exports = { getHealth };