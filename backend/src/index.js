require("dotenv").config();

const createApp = require("./config/app");
const connectDB = require("./config/db");

const startServer = async () => {
  const app = createApp();

  const PORT = process.env.PORT || 5000;

  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();