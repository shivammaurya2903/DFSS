const express = require("express");
const cors = require("cors");
const logger = require("../middleware/logger");
const errorHandler = require("../middleware/error");
const config = require("./index");

function createApp() {
  const app = express();

  // JSON parsing
  app.use(express.json({ limit: "10mb" }));

  // CORS configuration
  app.use(cors({ origin: config.frontendUrl }));

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
