const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/orders ─────────────────────────────
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-adminNote'),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─── GET /api/orders/number/:orderNumber ─────────
// MUST be before /:id so Express doesn't treat "number" as an id
router.get('/number/:orderNumber', async (req, res) => {
  const order = await Order.findOne({
    orderNumber: req.params.orderNumber,
    user: req.user._id,
  }).select('-adminNote');

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

// ─── GET /api/orders/:id ──────────────────────────
router.get('/:id', async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).select('-adminNote');

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

// POST /api/orders/:id/reorder
router.post('/:id/reorder', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { new: true, upsert: true }
  );

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    const variant = product?.variants.id(item.variantId);
    if (!product?.isPublished || !variant || variant.stock < item.quantity) continue;

    const existing = cart.items.find(cartItem =>
      String(cartItem.product) === String(item.product) &&
      String(cartItem.variantId) === String(item.variantId)
    );

    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, 10, variant.stock);
    } else {
      cart.items.push({
        product: item.product,
        variantId: item.variantId,
        name: item.name,
        image: item.image,
        price: product.price,
        size: item.size,
        color: item.color,
        quantity: Math.min(item.quantity, variant.stock),
      });
    }
  }

  await cart.save();
  res.json({ cart });
});

// POST /api/orders/:id/cancel-request
router.post('/:id/cancel-request', async (req, res) => {
  const { reason = '' } = req.body;
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
    return res.status(400).json({ error: 'This order can no longer be cancelled from your account.' });
  }

  order.cancellationRequested = true;
  order.cancellationReason = String(reason).slice(0, 500);
  order.cancellationRequestedAt = new Date();
  await order.save();
  res.json({ order });
});

module.exports = router;
