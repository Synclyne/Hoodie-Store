const axios = require('axios');
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { protect } = require('../middleware/auth');
const Cart    = require('../models/Cart');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');
const ShippingZone = require('../models/ShippingZone');
const StoreSettings = require('../models/StoreSettings');
const { sendOrderConfirmation } = require('../utils/email');

// ─── Pricing helpers ─────────────────────────────
const calcPricing = async (subtotal, shippingZoneId) => {
  const activeZoneCount = await ShippingZone.countDocuments({ isActive: true });
  if (activeZoneCount > 0 && !shippingZoneId) {
    const err = new Error('Please select a delivery zone.');
    err.statusCode = 400;
    throw err;
  }

  let shipping = 0;

  if (shippingZoneId) {
    const zone = await ShippingZone.findOne({ _id: shippingZoneId, isActive: true });
    if (!zone) {
      const err = new Error('Selected shipping zone is not available.');
      err.statusCode = 400;
      throw err;
    }

    shipping = zone.price;
    const freeOver = zone.freeOver ?? 5000;
    if (freeOver && subtotal >= freeOver) shipping = 0;
  }

  const total = subtotal + shipping;

  return {
    subtotal,
    shipping,
    tax: 0,
    total,
  };
};

const applyCoupon = async (code, subtotal, userId) => {
  if (!code) return { discount: 0, couponCode: '', couponId: null };
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) return { discount: 0, couponCode: '', couponId: null };
  const result = coupon.validate(userId, subtotal);
  if (!result.valid) return { discount: 0, couponCode: '', couponId: null };
  return { discount: coupon.calculateDiscount(subtotal), couponCode: coupon.code, couponId: coupon._id };
};

const markCouponUsed = async (couponPricing, userId) => {
  if (!couponPricing.couponId) return;
  const Coupon = require('../models/Coupon');
  await Coupon.updateOne(
    { _id: couponPricing.couponId },
    { $inc: { usedCount: 1 }, $addToSet: { usedBy: userId } }
  );
};

const decrementCartStock = async (cart) => {
  const decremented = [];
  try {
    for (const item of cart.items) {
      const result = await Product.updateOne(
        {
          _id: item.product._id,
          variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } },
        },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        const err = new Error(`Insufficient stock for "${item.name}" (${item.size}/${item.color}).`);
        err.statusCode = 409;
        throw err;
      }
      decremented.push(item);
    }
  } catch (err) {
    await Promise.all(decremented.map(item => Product.updateOne(
      { _id: item.product._id, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': item.quantity } }
    )));
    throw err;
  }
};

const restoreCartStock = (cart) => Promise.all(cart.items.map(item => Product.updateOne(
  { _id: item.product._id, 'variants._id': item.variantId },
  { $inc: { 'variants.$.stock': item.quantity } }
)));

// ─── POST /api/payments/initiate ─────────────────
// Step 1: validate cart + pricing, return tx_ref and pricing to frontend
// Flutterwave redirect flow: frontend opens Flutterwave's hosted page,
// user pays, Flutterwave redirects back to our redirect_url with tx_ref.
router.post('/initiate', protect, async (req, res) => {
  const { shippingAddress, customerNote = '', shippingZoneId, deliveryLocation = null } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({ error: 'shippingAddress is required.' });
  }

  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'price name isPublished');

  if (!cart || !cart.items.length) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // Validate stock + published
  for (const item of cart.items) {
    if (!item.product?.isPublished) {
      return res.status(400).json({ error: `"${item.name}" is no longer available.` });
    }
    const product = await Product.findById(item.product._id);
    const variant = product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for "${item.name}" (${item.size}/${item.color}).`,
      });
    }
  }

  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  let pricing;

  try {
    pricing = await calcPricing(subtotal, shippingZoneId);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Could not calculate shipping.' });
  }

const couponPricing = await applyCoupon(req.body.couponCode, subtotal, req.user._id);
pricing.discount = couponPricing.discount;

pricing.total = Math.max(
  0,
  pricing.subtotal +
    pricing.shipping -
    couponPricing.discount
);

  // Unique transaction reference
  const tx_ref = `HD-${req.user._id}-${Date.now()}`;

  const settings = await StoreSettings.findOne();
  const storeName = settings?.storeName || 'HOODIE';
  const logoUrl = settings?.logoUrl || `${process.env.CLIENT_URL}/logo.png`;

  // Build Flutterwave payment payload
  const payload = {
    tx_ref,
    amount:   pricing.total,
    currency: 'KES',
    redirect_url: `${process.env.CLIENT_URL}/checkout`,
    customer: {
      email:       req.user.email,
      phonenumber: shippingAddress.phone || '',
      name:        `${req.user.firstName} ${req.user.lastName}`,
    },
    customizations: {
      title:       `${storeName} Store`,
      description: `Order payment — ${cart.items.length} item(s)`,
      logo:        logoUrl,
    },
    meta: {
      userId:         req.user._id.toString(),
      cartId:         cart._id.toString(),
      shippingAddress: JSON.stringify(shippingAddress),
      customerNote,
    },
  };

  if (req.body.paymentMethod === 'cod') {
  try {
    await decrementCartStock(cart);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Could not reserve stock.' });
  }

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map(item => ({
      product: item.product._id,
      variantId: item.variantId,
      name: item.name,
      image: item.image,
      price: item.product.price,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
    shippingAddress,
    deliveryLocation,
    subtotal: pricing.subtotal,
    shipping: pricing.shipping,
    tax: pricing.tax,
    discount: pricing.discount,
    couponCode: couponPricing.couponCode,
    total: pricing.total,
    paymentStatus: 'pending',
    paymentMethod: 'cash_on_delivery',
    status: 'confirmed',
    confirmedAt: new Date(),
    customerNote,
  });
  await markCouponUsed(couponPricing, req.user._id).catch(err => {
    console.error('Coupon usage update failed:', err.message);
  });

  cart.items = [];
  await cart.save();

  const populatedUser = await User.findById(order.user).select('email firstName');
  if (populatedUser) {
    sendOrderConfirmation(order, populatedUser.email, populatedUser.firstName).catch(err => {
      console.error('Order confirmation email failed:', err.message);
    });
  }

  return res.status(201).json({
    orderId: order._id,
    order,
    pricing,
  });
}

  const response = await axios.post(
  'https://api.flutterwave.com/v3/payments',
  payload,
  {
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  }
);

  if (response.data.status !== 'success') {
    return res.status(502).json({ error: 'Failed to initiate payment. Please try again.' });
  }

  res.json({
    paymentLink: response.data.data.link, // redirect user to this URL
    tx_ref,
    pricing,
  });
});

// ─── POST /api/payments/verify ────────────────────
// Step 2: called by frontend after Flutterwave redirects back
// Flutterwave appends ?transaction_id=xxx&tx_ref=xxx&status=xxx to redirect_url
router.post('/verify', protect, async (req, res) => {
  const { transaction_id, tx_ref, shippingAddress, customerNote = '', shippingZoneId, deliveryLocation = null } = req.body;

  if (!transaction_id || !tx_ref) {
    return res.status(400).json({ error: 'transaction_id and tx_ref are required.' });
  }

  // Idempotency — order already created for this tx_ref
  const existing = await Order.findOne({ flutterwaveTxRef: tx_ref });
  if (existing) return res.json({ order: existing });

  // Verify with Flutterwave
  const response = await axios.get(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    }
  );
  const verification = response.data;

  if (verification.status !== 'success' || verification.data?.status !== 'successful') {
    return res.status(400).json({ error: 'Payment not confirmed by Flutterwave.' });
  }

  const flwData = verification.data;

  // Re-fetch cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'price name');

  if (!cart || !cart.items.length) {
    return res.status(400).json({ error: 'Cart is empty. Cannot create order.' });
  }

  // Recalculate server-side (never trust client amounts)
  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  let pricing;

  try {
    pricing = await calcPricing(subtotal, shippingZoneId);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Could not calculate shipping.' });
  }

const couponPricing = await applyCoupon(req.body.couponCode, subtotal, req.user._id);
pricing.discount = couponPricing.discount;

pricing.total = Math.max(
  0,
  pricing.subtotal +
    pricing.shipping -
    couponPricing.discount
);

  // Verify the amount paid matches what we calculated (within 1 KES tolerance for rounding)
  if (Math.abs(flwData.amount - pricing.total) > 1) {
    console.error(`Amount mismatch: expected ${pricing.total}, got ${flwData.amount} for tx_ref ${tx_ref}`);
    return res.status(400).json({ error: 'Payment amount mismatch. Please contact support.' });
  }

  // Create order. If Flutterwave/browser retries verification at the same time,
  // Mongo's unique index is the final idempotency guard.
  let order;
  try {
    await decrementCartStock(cart);

    order = await Order.create({
      user: req.user._id,
      items: cart.items.map(item => ({
        product:   item.product._id,
        variantId: item.variantId,
        name:      item.name,
        image:     item.image,
        price:     item.product.price,
        size:      item.size,
        color:     item.color,
        quantity:  item.quantity,
      })),
      shippingAddress,
      deliveryLocation,
      subtotal:   pricing.subtotal,
      shipping:   pricing.shipping,
      tax:        pricing.tax,
      discount:   pricing.discount,
      couponCode: couponPricing.couponCode,
      total:      pricing.total,
      paymentStatus:      'paid',
      paymentMethod:      flwData.payment_type || 'flutterwave',
      flutterwaveTxRef:   tx_ref,
      flutterwaveTxId:    String(transaction_id),
      status:             'confirmed',
      confirmedAt:        new Date(),
      customerNote,
    });
  } catch (err) {
    let restored = false;
    if (err?.code === 11000 && (err.keyPattern?.flutterwaveTxRef || err.keyPattern?.flutterwaveTxId)) {
      await restoreCartStock(cart);
      restored = true;
      const existingOrder = await Order.findOne({
        $or: [
          { flutterwaveTxRef: tx_ref },
          { flutterwaveTxId: String(transaction_id) },
        ],
        user: req.user._id,
      });
      if (existingOrder) return res.json({ order: existingOrder });
    }
    if (!restored) await restoreCartStock(cart);
    throw err;
  }

  await markCouponUsed(couponPricing, req.user._id).catch(err => {
    console.error('Coupon usage update failed:', err.message);
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  // Send order confirmation email (non-blocking)
  const populatedUser = await User.findById(order.user).select('email firstName');
  if (populatedUser) {
    sendOrderConfirmation(order, populatedUser.email, populatedUser.firstName).catch(err => {
      console.error('Order confirmation email failed:', err.message);
    });
  }

  res.status(201).json({ order });
});

// ─── POST /api/payments/webhook ───────────────────
// Flutterwave server-to-server webhook for async events
router.post('/webhook', express.json(), async (req, res) => {
  const secretHash = process.env.FLW_WEBHOOK_SECRET;
  const signature  = req.headers['verif-hash'];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body;

  if (event.event === 'charge.completed') {
    const data = event.data;
    if (data.status === 'successful') {
      // Mark order paid if it somehow wasn't already
      await Order.findOneAndUpdate(
        { flutterwaveTxRef: data.tx_ref },
        { paymentStatus: 'paid', status: 'confirmed', confirmedAt: new Date() }
      );
    }
    if (data.status === 'failed') {
      await Order.findOneAndUpdate(
        { flutterwaveTxRef: data.tx_ref },
        { paymentStatus: 'failed', status: 'cancelled', cancelledAt: new Date() }
      );
    }
  }

  res.json({ status: 'ok' });
});

module.exports = router;
