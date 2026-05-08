const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!exists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });

      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin already exists');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();