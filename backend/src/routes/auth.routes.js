const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  adminTest,
} = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const rateLimit = require("../middleware/rateLimit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "login",
  message: "Too many login attempts. Try again later.",
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: "register",
  message: "Too many registration attempts. Try again later.",
});

router.post("/register", registerLimiter, register);

router.post("/login", loginLimiter, login);

router.get("/me", authenticateToken, getMe);

router.patch("/me", authenticateToken, updateMe);

router.get("/admin-test", authenticateToken, authorizeRoles("admin"), adminTest);

module.exports = router;

