const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  adminTest,
} = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");

router.post("/register", register);

router.post("/login", login);

router.get("/me", authenticateToken, getMe);

router.get("/admin-test", authenticateToken, authorizeRoles("admin"), adminTest);

module.exports = router;

