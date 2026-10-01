const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const { getNodes, getNodeDetails } = require('../controllers/storageController');

router.use(authenticateToken);
router.get('/nodes', getNodes);
router.get('/nodes/:nodeId', getNodeDetails);

module.exports = router;
