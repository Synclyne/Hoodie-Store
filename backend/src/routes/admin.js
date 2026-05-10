const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');
const Cart    = require('../models/Cart');
const MediaAsset = require('../models/MediaAsset');
const { protect, adminOnly, requirePermission, requireAnyPermission, ownerOnly, isOwnerAdmin } = require('../middleware/auth');
const { upload }             = require('../utils/cloudinary');
const { sendShippingNotification, sendDeliveryNotification } = require('../utils/email');

router.use(protect, adminOnly);

const visibleReviews = (product) => (product.reviews || []).filter(review => review.approved !== false);
const syncProductReviewStats = (product) => {
  const approved = visibleReviews(product);
  product.numReviews = approved.length;
  product.rating = approved.length
    ? approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approved.length
    : 0;
};

// ─── POST /api/admin/upload ───────────────────────────────
// Works with Cloudinary (returns CDN URL) or local disk (returns /uploads/filename)
router.post('/upload', requireAnyPermission(['products', 'homepage']), upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded.' });
  const urls = req.files.map(f =>
    // Cloudinary sets f.path = secure_url. Local disk sets f.filename.
    f.path && f.path.startsWith('http') ? f.path : `/uploads/${f.filename}`
  );
  await MediaAsset.insertMany(req.files.map((file, index) => ({
    url: urls[index],
    originalName: file.originalname || '',
    mimeType: file.mimetype || '',
    size: file.size || 0,
    source: file.path && file.path.startsWith('http') ? 'cloudinary' : 'local',
    uploadedBy: req.user._id,
  })));
  res.json({ urls });
});

// GET /api/admin/media
router.get('/media', requireAnyPermission(['products', 'homepage']), async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [assets, total] = await Promise.all([
    MediaAsset.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('uploadedBy', 'firstName lastName'),
    MediaAsset.countDocuments(),
  ]);
  res.json({ assets, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// DELETE /api/admin/media/:id
router.delete('/media/:id', requireAnyPermission(['products', 'homepage']), async (req, res) => {
  const asset = await MediaAsset.findByIdAndDelete(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Image not found.' });
  res.json({ message: 'Image removed from media library.' });
});

// ─── PRODUCTS ─────────────────────────────────────

// GET /api/admin/products — all products including unpublished
router.get('/products', requirePermission('products'), async (req, res) => {
  const { page = 1, limit = 20, search, category, published, lowStock } = req.query;
  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (published !== undefined) filter.isPublished = published === 'true';
  if (lowStock !== undefined) {
    const threshold = Math.max(Number(lowStock) || 10, 1);
    filter.$expr = { $lt: [{ $sum: '$variants.stock' }, threshold] };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-reviews'),
    Product.countDocuments(filter),
  ]);
  res.json({ products, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/admin/products/:id — single product (for edit form)
router.get('/products/:id', requirePermission('products'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

// POST /api/admin/products — create product
router.post('/products', requirePermission('products'), async (req, res) => {
  // Auto-generate slug
  if (!req.body.slug && req.body.name) {
    req.body.slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    // Ensure uniqueness
    const existing = await Product.findOne({ slug: req.body.slug });
    if (existing) req.body.slug += `-${uuidv4().substring(0, 4)}`;
  }

  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

// PUT /api/admin/products/:id — update product
router.put('/products/:id', requirePermission('products'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

// DELETE /api/admin/products/:id — soft delete (unpublish)
router.delete('/products/:id', requirePermission('products'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isPublished: false },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ message: 'Product unpublished.', product });
});

// ─── ORDERS ───────────────────────────────────────

// GET /api/admin/reviews — moderation queue
router.get('/reviews', requirePermission('products'), async (req, res) => {
  const { status = 'pending' } = req.query;
  const products = await Product.find({ 'reviews.0': { $exists: true } })
    .select('name slug reviews rating numReviews')
    .populate('reviews.user', 'firstName lastName email')
    .sort({ updatedAt: -1 });

  const reviews = [];
  products.forEach(product => {
    product.reviews.forEach(review => {
      const isApproved = review.approved !== false;
      if (status === 'pending' && isApproved) return;
      if (status === 'approved' && !isApproved) return;
      reviews.push({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        review,
      });
    });
  });

  reviews.sort((a, b) => new Date(b.review.createdAt || 0) - new Date(a.review.createdAt || 0));
  res.json({ reviews });
});

// PATCH /api/admin/products/:productId/reviews/:reviewId — approve/unapprove
router.patch('/products/:productId/reviews/:reviewId', requirePermission('products'), async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const review = product.reviews.id(req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  if (req.body.approved !== undefined) review.approved = !!req.body.approved;
  syncProductReviewStats(product);
  await product.save();
  res.json({ product, review });
});

// DELETE /api/admin/products/:productId/reviews/:reviewId
router.delete('/products/:productId/reviews/:reviewId', requirePermission('products'), async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const review = product.reviews.id(req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  review.deleteOne();
  syncProductReviewStats(product);
  await product.save();
  res.json({ message: 'Review removed.', product });
});

// GET /api/admin/orders
router.get('/orders', requirePermission('orders'), async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (q && String(q).trim()) {
    const search = String(q).trim();
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { orderNumber: rx },
      { 'shippingAddress.fullName': rx },
      { 'shippingAddress.phone': rx },
      { 'shippingAddress.city': rx },
      { 'shippingAddress.line1': rx },
      { trackingNumber: rx },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/admin/orders/:id
router.get('/orders/:id', requirePermission('orders'), async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

// PUT /api/admin/orders/:id — update status, tracking
router.put('/orders/:id', requirePermission('orders'), async (req, res) => {
  const allowed = ['status', 'trackingNumber', 'trackingCarrier', 'adminNote'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (updates.status === 'confirmed') updates.confirmedAt = new Date();
  if (updates.status === 'shipped' && !updates.shippedAt) updates.shippedAt = new Date();
  if (updates.status === 'delivered') updates.deliveredAt = new Date();
  if (updates.status === 'cancelled') updates.cancelledAt = new Date();

  const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('user', 'firstName lastName email');
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Send shipping notification email when marked as shipped
  if (updates.status === 'shipped' && order.user?.email) {
    sendShippingNotification(order, order.user.email, order.user.firstName).catch(err => {
      console.error('Shipping email failed:', err.message);
    });
  }

  if (updates.status === 'delivered' && order.user?.email) {
    sendDeliveryNotification(order, order.user.email, order.user.firstName).catch(err => {
      console.error('Delivery email failed:', err.message);
    });
  }

  res.json({ order });
});

// ─── USERS ────────────────────────────────────────

// GET /api/admin/users
router.get('/users', ownerOnly, async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const filter = {};
  if (role) filter.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', ownerOnly, async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

const ADMIN_PERMISSIONS = ['homepage', 'products', 'orders', 'shipping', 'coupons', 'settings', 'support', 'staff'];

// GET /api/admin/staff
router.get('/staff', ownerOnly, async (req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ adminType: 1, createdAt: -1 });
  res.json({ admins, permissions: ADMIN_PERMISSIONS });
});

// POST /api/admin/staff
router.post('/staff', ownerOnly, async (req, res) => {
  const { email, firstName, lastName, password, permissions = [], adminType = 'staff' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const cleanPermissions = permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission));
  const nextAdminType = adminType === 'owner' ? 'owner' : 'staff';

  let user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (user) {
    user.role = 'admin';
    user.adminType = nextAdminType;
    user.adminPermissions = nextAdminType === 'owner' ? [] : cleanPermissions;
    user.isActive = true;
    await user.save();
    return res.json({ admin: user });
  }

  if (!firstName || !lastName || !password) {
    return res.status(400).json({ error: 'First name, last name and password are required for a new admin.' });
  }

  user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'admin',
    adminType: nextAdminType,
    adminPermissions: nextAdminType === 'owner' ? [] : cleanPermissions,
  });
  await Cart.create({ user: user._id, items: [] });
  res.status(201).json({ admin: user });
});

// PUT /api/admin/staff/:id
router.put('/staff/:id', ownerOnly, async (req, res) => {
  if (String(req.params.id) === String(req.user._id) && req.body.adminType === 'staff') {
    return res.status(400).json({ error: 'You cannot remove your own owner access.' });
  }

  const { permissions = [], adminType, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role !== 'admin') return res.status(400).json({ error: 'User is not an admin.' });

  if (adminType) user.adminType = adminType === 'owner' ? 'owner' : 'staff';
  if (user.adminType === 'owner') {
    user.adminPermissions = [];
  } else {
    user.adminPermissions = permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission));
  }
  if (isActive !== undefined) user.isActive = Boolean(isActive);

  await user.save();
  res.json({ admin: user });
});

// DELETE /api/admin/staff/:id
router.delete('/staff/:id', ownerOnly, async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ error: 'You cannot remove your own admin access.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (isOwnerAdmin(user)) {
    const ownerCount = await User.countDocuments({ role: 'admin', $or: [{ adminType: 'owner' }, { adminType: { $exists: false } }] });
    if (ownerCount <= 1) return res.status(400).json({ error: 'At least one owner admin is required.' });
  }

  user.role = 'customer';
  user.adminType = 'staff';
  user.adminPermissions = [];
  await user.save();
  res.json({ user });
});

// ─── ANALYTICS ────────────────────────────────────

// GET /api/admin/analytics/revenue-chart
// MUST be before /analytics so it isn't swallowed by that route
router.get('/analytics/revenue-chart', async (req, res) => {
  const { months = 6 } = req.query;
  const data = [];
  const now = new Date();

  for (let i = Number(months) - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const result = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    data.push({
      month:   start.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: result[0]?.revenue || 0,
      orders:  result[0]?.count  || 0,
    });
  }

  res.json({ chart: data });
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    pendingOrders,
    totalCustomers,
    newCustomersThisMonth,
    totalProducts,
    lowStockProducts,
    recentOrders,
    topProducts,
    orderStatusBreakdown,
    paymentStatusBreakdown,
    categorySales,
    repeatCustomers,
    couponPerformance,
    bestSizes,
    bestColors,
    abandonedCarts,
    dailySales,
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Order.countDocuments({ paymentStatus: 'paid', createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth } }),
    Product.countDocuments({ isPublished: true }),
    Product.countDocuments({ isPublished: true, $expr: { $lt: [{ $sum: '$variants.stock' }, 10] } }),
    Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(5).populate('user', 'firstName lastName'),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDoc' } },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$productDoc.category', 'unknown'] }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: '$user', orders: { $sum: 1 } } },
      { $match: { orders: { $gte: 2 } } },
      { $count: 'count' },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', couponCode: { $nin: ['', null] } } },
      { $group: { _id: '$couponCode', uses: { $sum: 1 }, discount: { $sum: '$discount' }, revenue: { $sum: '$total' } } },
      { $sort: { uses: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.size', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.color', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
    ]),
    Cart.countDocuments({ items: { $exists: true, $ne: [] }, updatedAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const thisMonthRev = monthRevenue[0]?.total || 0;
  const lastMonthRev = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = lastMonthRev > 0
    ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1)
    : 100;

  res.json({
    revenue: {
      total: totalRevenue[0]?.total || 0,
      thisMonth: thisMonthRev,
      lastMonth: lastMonthRev,
      growth: Number(revenueGrowth),
    },
    orders: { total: totalOrders, thisMonth: monthOrders, pending: pendingOrders },
    customers: { total: totalCustomers, newThisMonth: newCustomersThisMonth },
    products: { total: totalProducts, lowStock: lowStockProducts },
    recentOrders,
    topProducts,
    orderStatusBreakdown,
    paymentStatusBreakdown,
    categorySales,
    repeatCustomers: repeatCustomers[0]?.count || 0,
    couponPerformance,
    bestSizes,
    bestColors,
    abandonedCarts,
    dailySales,
  });
});

const HomepageConfig = require('../models/HomepageConfig');

// ─── HOMEPAGE CONFIG ──────────────────────────────

// GET /api/admin/homepage
router.get('/homepage', requirePermission('homepage'), async (req, res) => {
  let config = await HomepageConfig.findOne();
  if (!config) config = await HomepageConfig.create({});
  res.json({ config });
});

// PUT /api/admin/homepage
router.put('/homepage', requirePermission('homepage'), async (req, res) => {
  const config = await HomepageConfig.findOneAndUpdate(
    {},
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ config });
});

module.exports = router;
