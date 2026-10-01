const express = require('express');
const router = express.Router();
// const authenticateToken = require('../middleware/authenticateToken'); // Node heartbeat might not need user token, or can use an internal token
const { getNodes, getNodeDetails, heartbeat, registerNode } = require('../controllers/storageController');

router.post('/register', registerNode);
router.post('/heartbeat', heartbeat);

// require token for user/admin routes
const authenticateToken = require('../middleware/authenticateToken');
router.use(authenticateToken);
router.get('/nodes', getNodes);
router.get('/nodes/:nodeId', getNodeDetails);

module.exports = router;
