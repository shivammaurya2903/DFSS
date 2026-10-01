const express = require("express");
const cors = require("cors");
const logger = require("../middleware/logger");
const errorHandler = require("../middleware/error");

function createApp() {
  const app = express();

  // JSON parsing
  app.use(express.json({ limit: "10mb" }));

  // CORS configuration
  const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
  app.use(cors({ origin: corsOrigin }));

  // Request logging
  app.use(logger);

  // Health route
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      service: "distributed-file-storage-backend",
      status: "healthy",
    });
  });

  // Authentication routes
  const authRouter = express.Router();

  const User = require("../models/User");
  const jwt = require("jsonwebtoken");

  // Register
  authRouter.post("/register", async (req, res) => {
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

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Login
  authRouter.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get current user (protected)
  authRouter.get("/me", async (req, res) => {
    try {
      // authenticateToken middleware logic inline
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              success: false,
              message: "Token expired",
            });
          }
          return res.status(403).json({
            success: false,
            message: "Invalid token",
          });
        }

        User.findById(user.userId).select("-password").then((foundUser) => {
          res.json({
            success: true,
            user: {
              id: foundUser._id,
              name: foundUser.name,
              email: foundUser.email,
              role: foundUser.role,
            },
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin test (protected)
  authRouter.get(
    "/admin-test",
    async (req, res) => {
      // authenticate + authorize logic inline
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              success: false,
              message: "Token expired",
            });
          }
          return res.status(403).json({
            success: false,
            message: "Invalid token",
          });
        }

        const foundUser = await User.findById(user.userId);
        if (foundUser.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Forbidden - admin access required",
          });
        }

        res.json({
          success: true,
          message: "Admin secret area",
          user: {
            id: foundUser._id,
            role: foundUser.role,
          },
        });
      });
    },
    (req, res) => {}
  );

  app.use("/api/auth", authRouter);

  // Error handling middleware (should be placed last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;