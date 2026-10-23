const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const dummyHash = bcrypt.hashSync("dfss-invalid-password", 10);

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  usedStorage: user.usedStorage,
  storageQuota: user.storageQuota,
  createdAt: user.createdAt,
});

const issueToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    user = new User({
      name,
      email,
      password,
    });

    await user.save();

    const token = issueToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!user) {
      // Keep the timing close to a real comparison to avoid user enumeration.
      await bcrypt.compare(String(password || ""), dummyHash);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const retryAfter = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Account temporarily locked. Try again later.",
        retryAfter,
      });
    }

    const isMatch = await user.comparePassword(String(password || ""));
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: issueToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId || req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId || req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, email, currentPassword, newPassword } = req.body || {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (normalized !== user.email) {
        const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
        if (existing) {
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
        user.email = normalized;
      }
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "currentPassword is required to change the password",
        });
      }
      const isMatch = await user.comparePassword(String(currentPassword));
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated",
      user: serializeUser(user),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const adminTest = async (req, res) => {
  res.json({
    success: true,
    message: "Admin secret area",
    user: {
      id: req.user.userId,
      role: req.user.role,
    },
  });
};

module.exports = { register, login, getMe, updateMe, adminTest };
