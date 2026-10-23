const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', 'backend', '.env'),
  quiet: true,
});

const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/src/models/User');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'System Admin';

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

const run = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const dbName = process.env.MONGODB_DATABASE || 'distributed_file_storage';
    await mongoose.connect(mongoURI, { dbName });

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      user.name = name;
      user.password = password;
      await user.save();
      console.log(`Updated existing account to admin: ${email}`);
    } else {
      user = new User({ name, email, password, role: 'admin' });
      await user.save();
      console.log(`Created admin account: ${email}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
