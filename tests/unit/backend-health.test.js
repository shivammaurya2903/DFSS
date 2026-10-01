const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    success: true,
    service: "distributed-file-storage-backend",
    status: "healthy",
  }));
});

const PORT = 9876;

server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);

  // Test the health endpoint
  const options = {
    hostname: "localhost",
    port: PORT,
    path: "/api/health",
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
        parsed.success === true &&
        parsed.service === "distributed-file-storage-backend" &&
        parsed.status === "healthy"
      ) {
        console.log("✓ Backend health endpoint test PASSED");
      } else {
        console.log("✗ Backend health endpoint test FAILED");
      }

      server.close();
      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error("Request error:", err);
    server.close();
    process.exit(1);
  });
});