const express      = require('express');
const router       = express.Router();
const ShippingZone = require('../models/ShippingZone');
const { protect, adminOnly, requirePermission } = require('../middleware/auth');

// GET /api/shipping — public, used in checkout
router.get('/', async (req, res) => {
  const zones = await ShippingZone.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
  res.json({ zones });
});

// Admin routes
router.get('/admin',    protect, adminOnly, requirePermission('shipping'), async (req, res) => {
  const zones = await ShippingZone.find().sort({ sortOrder: 1 });
  res.json({ zones });
});

router.post('/admin',   protect, adminOnly, requirePermission('shipping'), async (req, res) => {
  const zone = await ShippingZone.create(req.body);
  res.status(201).json({ zone });
});

router.put('/admin/:id', protect, adminOnly, requirePermission('shipping'), async (req, res) => {
  const zone = await ShippingZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!zone) return res.status(404).json({ error: 'Zone not found.' });
  res.json({ zone });
});

router.delete('/admin/:id', protect, adminOnly, requirePermission('shipping'), async (req, res) => {
  await ShippingZone.findByIdAndDelete(req.params.id);
  res.json({ message: 'Zone deleted.' });
});

module.exports = router;
