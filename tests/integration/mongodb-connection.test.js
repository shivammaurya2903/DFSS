const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/distributed_file_storage";
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || "distributed_file_storage";

async function testMongoDBConnection() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    if (dbState === 1) {
      console.log("✓ MongoDB connection test PASSED");
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.log("✗ MongoDB connection test FAILED - not connected");
      await mongoose.disconnect();
      process.exit(1);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.log("✗ MongoDB connection test FAILED");
    process.exit(1);
  }
}

testMongoDBConnection();