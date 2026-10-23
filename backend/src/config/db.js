const mongoose = require("mongoose");
const dns = require("dns");
const config = require("./index");

const connectDB = async () => {
  // Set fallback public DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED on Windows
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if DNS server configuration is restricted
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDatabase,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    // If Atlas connection failed, attempt local fallback
    if (config.mongoUri.includes('mongodb+srv://') || !config.mongoUri.includes('localhost')) {
      console.log('Attempting local MongoDB connection (mongodb://127.0.0.1:27017/distributed_file_storage)...');
      try {
        const localUri = 'mongodb://127.0.0.1:27017/distributed_file_storage';
        const conn = await mongoose.connect(localUri, {
          dbName: config.mongoDatabase,
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
        return true;
      } catch (fallbackError) {
        console.error(`Local MongoDB fallback failed: ${fallbackError.message}`);
      }
    }

    console.warn('\n------------------------------------------------------------');
    console.warn('MongoDB connection failed. Common causes:');
    console.warn('1. Current IP address is not whitelisted on MongoDB Atlas (Network Access -> Add IP 0.0.0.0/0).');
    console.warn('2. Local MongoDB server is not running on port 27017.');
    console.warn('------------------------------------------------------------\n');

    return false;
  }
};

module.exports = connectDB;
