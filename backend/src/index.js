require("dotenv").config();

const createApp = require("./config/app");
const connectDB = require("./config/db");
const config = require("./config");
const HeartbeatMonitor = require("./recovery/HeartbeatMonitor");
const RecoveryManager = require("./recovery/RecoveryManager");

const startServer = async () => {
  const app = createApp();

  try {
    await connectDB();

    const server = app.listen(config.port, config.host, () => {
      console.log(`[Server] Backend running on http://${config.host}:${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
      console.log(`[Server] Research mode: ${config.researchMode}`);
    });

    // ─────────────────────────────────────────
    // Start HeartbeatMonitor background process.
    // Register RecoveryManager to handle node failures.
    // ─────────────────────────────────────────
    HeartbeatMonitor.onNodeFailure(async (nodeId) => {
      console.log(`[Server] Failure detected on node ${nodeId} — triggering recovery`);
      await RecoveryManager.handleNodeFailure(nodeId);
    });
    HeartbeatMonitor.start();

    // ─────────────────────────────────────────
    // Graceful shutdown
    // ─────────────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      HeartbeatMonitor.stop();
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("[Server] Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

  } catch (error) {
    console.error("[Server] Failed to start:", error.message);
    process.exit(1);
  }
};

startServer();