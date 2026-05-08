const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const Cart     = require('../models/Cart');
const { protect } = require('../middleware/auth');
const { sendOrderConfirmation, sendPasswordReset } = require('../utils/email');

// ─── Helpers ──────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ token, user });
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// ─── POST /api/auth/register ──────────────────────────────
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/\d/).withMessage('Password must contain a number'),
  ],
  validate,
  async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ firstName, lastName, email, password });
    await Cart.create({ user: user._id, items: [] });

    sendAuthResponse(res, user, 201);
  }
);

// ─── POST /api/auth/login ─────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }

    sendAuthResponse(res, user);
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user });
});

// ─── PUT /api/auth/me ─────────────────────────────────────
router.put(
  '/me',
  protect,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate,
  async (req, res) => {
    const allowed = ['firstName', 'lastName', 'email', 'addresses', 'defaultAddress'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.defaultAddress !== undefined) {
      const addresses = updates.addresses || req.user.addresses || [];
      updates.defaultAddress = Math.max(0, Math.min(Number(updates.defaultAddress) || 0, Math.max(addresses.length - 1, 0)));
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });
    res.json({ user });
  }
);

// ─── PUT /api/auth/change-password ────────────────────────
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/\d/),
  ],
  validate,
  async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  }
);

// ─── POST /api/auth/forgot-password ──────────────────────
// Generates a reset token and emails it to the user
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validate,
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+passwordResetToken +passwordResetExpires');

    // Always respond 200 — don't reveal whether email exists
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate secure token
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send email (fire and forget — don't block response)
    sendPasswordReset(user.email, user.firstName, rawToken).catch(err => {
      console.error('Password reset email failed:', err.message);
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  }
);

// ─── POST /api/auth/reset-password ───────────────────────
// Validates token and sets new password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/\d/).withMessage('Password must contain a number'),
  ],
  validate,
  async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    user.password             = req.body.password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log them in immediately
    sendAuthResponse(res, user);
  }
);

module.exports = router;
