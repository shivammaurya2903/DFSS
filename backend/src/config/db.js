const mongoose = require("mongoose");
const config = require("./index");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDatabase,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
