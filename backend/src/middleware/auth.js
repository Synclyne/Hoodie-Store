const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+isActive');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User no longer exists or is deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Require admin role
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

const isOwnerAdmin = (user) =>
  user?.role === 'admin' && (user.adminType === 'owner' || !user.adminType);

const hasPermission = (user, permission) =>
  isOwnerAdmin(user) || user?.adminPermissions?.includes(permission);

const requirePermission = (permission) => (req, res, next) => {
  if (!hasPermission(req.user, permission)) {
    return res.status(403).json({ error: 'You do not have permission to access this admin area.' });
  }
  next();
};

const requireAnyPermission = (permissions) => (req, res, next) => {
  if (isOwnerAdmin(req.user) || permissions.some((permission) => req.user?.adminPermissions?.includes(permission))) {
    return next();
  }
  return res.status(403).json({ error: 'You do not have permission to access this admin area.' });
};

const ownerOnly = (req, res, next) => {
  if (!isOwnerAdmin(req.user)) {
    return res.status(403).json({ error: 'Owner admin access required.' });
  }
  next();
};

// Optional auth — attaches user if token exists, but doesn't block if not
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (_) { /* ignore */ }
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth, requirePermission, requireAnyPermission, ownerOnly, isOwnerAdmin, hasPermission };
