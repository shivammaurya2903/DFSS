const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");

// Get all users (Admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
