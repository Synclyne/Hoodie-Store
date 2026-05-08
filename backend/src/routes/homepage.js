const express = require('express');
const router  = express.Router();
const HomepageConfig = require('../models/HomepageConfig');

// GET /api/homepage — public, no auth required
// Returns the current homepage config (creates default if none exists)
router.get('/', async (req, res) => {
  let config = await HomepageConfig.findOne();
  if (!config) {
    config = await HomepageConfig.create({});
  }
  res.json({ config });
});

module.exports = router;