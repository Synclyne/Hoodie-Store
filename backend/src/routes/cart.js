const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// All cart routes require authentication
router.use(protect);

// ─── GET /api/cart ───────────────────────────────
router.get('/', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name slug images price comparePrice isPublished');

  if (!cart) {
    const newCart = await Cart.create({ user: req.user._id, items: [] });
    return res.json({ cart: newCart });
  }

  // Filter out unpublished products
  cart.items = cart.items.filter(item => item.product?.isPublished);

  res.json({
    cart,
    subtotal: cart.subtotal,
    itemCount: cart.itemCount,
  });
});

// ─── POST /api/cart/items ─────────────────────────
// Add item to cart
router.post('/items', async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId || !variantId) {
    return res.status(400).json({ error: 'productId and variantId are required.' });
  }

  // Validate product and variant
  const product = await Product.findById(productId);
  if (!product || !product.isPublished) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    return res.status(404).json({ error: 'Variant not found.' });
  }

  if (variant.stock < quantity) {
    return res.status(400).json({
      error: `Only ${variant.stock} items in stock.`,
      available: variant.stock,
    });
  }

  const primaryImage = product.images.find(i => i.isPrimary) || product.images[0];

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if same variant already in cart
  const existingItem = cart.items.find(
    item => item.product.toString() === productId && item.variantId.toString() === variantId
  );

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > variant.stock) {
      return res.status(400).json({
        error: `Cannot add more. Only ${variant.stock} in stock, you already have ${existingItem.quantity} in cart.`,
      });
    }
    existingItem.quantity = Math.min(newQty, 10);
  } else {
    cart.items.push({
      product: productId,
      variantId,
      name: product.name,
      image: primaryImage?.url || '',
      price: product.price,
      size: variant.size,
      color: variant.color,
      quantity,
    });
  }

  await cart.save();
  res.json({ cart, subtotal: cart.subtotal, itemCount: cart.itemCount });
});

// ─── PUT /api/cart/items/:itemId ──────────────────
// Update quantity
router.put('/items/:itemId', async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart not found.' });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found in cart.' });

  // Check stock
  const product = await Product.findById(item.product);
  const variant = product?.variants.id(item.variantId);
  if (variant && quantity > variant.stock) {
    return res.status(400).json({ error: `Only ${variant.stock} in stock.` });
  }

  item.quantity = Math.min(quantity, 10);
  await cart.save();
  res.json({ cart, subtotal: cart.subtotal, itemCount: cart.itemCount });
});

// ─── DELETE /api/cart/items/:itemId ──────────────
router.delete('/items/:itemId', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart not found.' });

  cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
  await cart.save();
  res.json({ cart, subtotal: cart.subtotal, itemCount: cart.itemCount });
});

// ─── DELETE /api/cart ─────────────────────────────
// Clear cart
router.delete('/', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ message: 'Cart cleared.' });
});

module.exports = router;
