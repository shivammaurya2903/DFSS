require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const run = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const dbName = process.env.MONGODB_DATABASE || 'distributed_file_storage';
    await mongoose.connect(mongoURI, { dbName });
    
    const email = 'admin@dfss.com';
    const password = 'admin123'; // Must be at least 6 characters
    const name = 'System Admin';
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      user.role = 'admin';
      user.password = password; // Pre-save hook will hash it
      await user.save();
      console.log('Successfully updated existing account to admin in db: ' + dbName);
    } else {
      user = new User({
        name,
        email,
        password,
        role: 'admin'
      });
      await user.save();
      console.log('Successfully created new admin account in db: ' + dbName);
    }
    
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
};
run();
