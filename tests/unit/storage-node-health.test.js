const http = require("http");
const path = require("path");
const fs = require("fs");

// Start the storage node server
const appPath = path.resolve(__dirname, "../..", "storage-nodes\node-1\src\index.js");
const app = require(appPath);

const PORT = process.env.STORAGE_PORT || 5001;

setTimeout(() => {
  console.log("Storage node should be running");

  // Test the health endpoint
  const options = {
    hostname: "localhost",
    port: PORT,
    path: "/internal/health",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      const parsed = JSON.parse(data);
      console.log("Response:", JSON.stringify(parsed, null, 2));

      if (
        parsed.nodeId === "node-1" &&
        parsed.status === "healthy"
      ) {
        console.log("✓ Storage Node 1 health endpoint test PASSED");
      } else {
        console.log("✗ Storage Node 1 health endpoint test FAILED");
      }

      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error("Request error:", err);
    process.exit(1);
  });

  req.end();
}, 2000);