const express           = require('express');
const router            = express.Router();
const StockNotification = require('../models/StockNotification');
const Product           = require('../models/Product');
const { optionalAuth }  = require('../middleware/auth');

// POST /api/stock-notify — sign up for restock notification
router.post('/', optionalAuth, async (req, res) => {
  const { productId, variantId, email, name } = req.body;
  if (!productId || !email) return res.status(400).json({ error: 'Product and email are required.' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  try {
    await StockNotification.create({ product: productId, variantId, email, name });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ message: 'You are already on the notification list for this item.' });
    }
    throw err;
  }

  res.json({ message: `We'll email ${email} when this item is back in stock.` });
});

module.exports = router;
