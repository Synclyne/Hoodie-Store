const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly, requirePermission } = require('../middleware/auth');

const getSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) settings = await StoreSettings.create({});
  return settings;
};

// GET /api/settings - public store settings used by the storefront
router.get('/', async (req, res) => {
  const settings = await getSettings();
  res.json({ settings });
});

// GET /api/settings/admin
router.get('/admin', protect, adminOnly, requirePermission('settings'), async (req, res) => {
  const settings = await getSettings();
  res.json({ settings });
});

// PUT /api/settings/admin
router.put('/admin', protect, adminOnly, requirePermission('settings'), async (req, res) => {
  const settings = await StoreSettings.findOneAndUpdate(
    {},
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ settings });
});

module.exports = router;
