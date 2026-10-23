const express = require("express");
const cors = require("cors");
const logger = require("../middleware/logger");
const errorHandler = require("../middleware/error");
const config = require("./index");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Conservative security headers for a JSON API.
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    if (config.nodeEnv === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // JSON parsing
  app.use(express.json({ limit: "10mb" }));

  // CORS configuration (explicit allow-list)
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));

  // Request logging
  app.use(logger);

  // Main API Router
  const apiRouter = require("../routes/api.routes");
  app.use("/api", apiRouter);

  // Error handling middleware (should be placed last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
