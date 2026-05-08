const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const { protect, adminOnly, requirePermission } = require('../middleware/auth');

// ─── POST /api/coupons/validate ───────────────────────────
// Called from checkout to check if a code is valid
router.post('/validate', protect, async (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required.' });

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) return res.status(404).json({ error: 'Coupon code not found.' });

  const result = coupon.validate(req.user._id, cartTotal);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const discount = coupon.calculateDiscount(cartTotal);
  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    description: coupon.description,
  });
});

// ─── Admin CRUD ───────────────────────────────────────────
router.use('/admin', protect, adminOnly, requirePermission('coupons'));

// GET /api/coupons/admin
router.get('/admin', async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});

// POST /api/coupons/admin
router.post('/admin', async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ coupon });
});

// PUT /api/coupons/admin/:id
router.put('/admin/:id', async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
  res.json({ coupon });
});

// DELETE /api/coupons/admin/:id
router.delete('/admin/:id', async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted.' });
});

module.exports = router;
