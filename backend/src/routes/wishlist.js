const express  = require('express');
const router   = express.Router();
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/wishlist
router.get('/', async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate('products', 'name slug price comparePrice images badge totalStock variants');
  res.json({ products: wishlist?.products || [] });
});

// POST /api/wishlist/:productId — toggle (add if not there, remove if there)
router.post('/:productId', async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

  const id = req.params.productId;
  const idx = wishlist.products.findIndex(p => p.toString() === id);
  let action;

  if (idx === -1) {
    wishlist.products.push(id);
    action = 'added';
  } else {
    wishlist.products.splice(idx, 1);
    action = 'removed';
  }

  await wishlist.save();
  res.json({ action, count: wishlist.products.length });
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(p => p.toString() !== req.params.productId);
    await wishlist.save();
  }
  res.json({ message: 'Removed from wishlist.' });
});

module.exports = router;
