const User = require('../models/User');
const Cart = require('../models/Cart');

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const normalizedEmail = String(email).toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (user) {
    let changed = false;
    if (user.role !== 'admin') {
      user.role = 'admin';
      changed = true;
    }
    if (user.adminType !== 'owner') {
      user.adminType = 'owner';
      user.adminPermissions = [];
      changed = true;
    }
    if (!user.isActive) {
      user.isActive = true;
      changed = true;
    }
    if (changed) {
      await user.save();
      console.log(`Admin owner access ensured for ${normalizedEmail}`);
    }
    return;
  }

  user = await User.create({
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
    email: normalizedEmail,
    password,
    role: 'admin',
    adminType: 'owner',
    adminPermissions: [],
  });
  await Cart.create({ user: user._id, items: [] });
  console.log(`Admin user created for ${normalizedEmail}`);
}

module.exports = ensureAdmin;
