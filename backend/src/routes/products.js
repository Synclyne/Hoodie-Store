const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// ─── GET /api/products ────────────────────────────
router.get('/', async (req, res) => {
  const {
    category, gender, minPrice, maxPrice,
    badge, search, sort = 'newest',
    page = 1, limit = 20,
  } = req.query;

  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (gender) filter.gender = { $in: [gender, 'unisex'] };
  if (badge) filter.badge = badge;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  const sortMap = {
    newest:       { createdAt: -1 },
    oldest:       { createdAt:  1 },
    'price-asc':  { price:  1 },
    'price-desc': { price: -1 },
    popular:      { numReviews: -1, rating: -1 },
  };
  const sortObj = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).select('-reviews -__v'),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  });
});

// ─── GET /api/products/trending ──────────────────
// Products sorted by how many times they've been ordered in the last 30 days
router.get('/trending', async (req, res) => {
  const { limit = 12 } = req.query;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const Order = require('../models/Order');

  // Aggregate orders to find most-sold product IDs
  const topSold = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: since } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
    { $sort: { totalSold: -1 } },
    { $limit: Number(limit) },
  ]);

  if (!topSold.length) {
    // Fallback: return newest products if no orders yet
    const products = await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select('-reviews -__v');
    return res.json({ products });
  }

  const ids = topSold.map(p => p._id);
  const products = await Product.find({ _id: { $in: ids }, isPublished: true })
    .select('-reviews -__v');

  // Preserve the sort order from aggregation
  const sorted = ids
    .map(id => products.find(p => p._id.toString() === id.toString()))
    .filter(Boolean);

  res.json({ products: sorted });
});

// ─── GET /api/products/id/:id ─────────────────────
// Fetch by MongoDB _id — used for recently viewed
router.get('/id/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
    .select('name slug price comparePrice images badge totalStock category');
  if (!product) return res.status(404).json({ error: 'Not found.' });
  res.json({ product });
});

// ─── GET /api/products/featured ──────────────────
// MUST be before /:slug
router.get('/featured', async (req, res) => {
  const products = await Product.find({ isPublished: true, isFeatured: true })
    .limit(8)
    .select('-reviews -__v');
  res.json({ products });
});

// ─── GET /api/products/:slug/related ─────────────
// MUST be before /:slug
router.get('/meta/price-range', async (req, res) => {
  const result = await Product.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: null, maxPrice: { $max: '$price' } } },
  ]);
  res.json({ maxPrice: result[0]?.maxPrice || 10000 });
});

router.get('/seo/sitemap', async (req, res) => {
  const products = await Product.find({ isPublished: true })
    .sort({ updatedAt: -1 })
    .select('slug updatedAt category')
    .lean();

  res.json({ products });
});

router.get('/:slug/related', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isPublished: true,
  }).limit(4).select('-reviews -__v');

  res.json({ products: related });
});

// ─── GET /api/products/:slug ──────────────────────
router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isPublished: true })
    .populate('reviews.user', 'firstName lastName');
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

// ─── POST /api/products/:id/reviews ──────────────
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required.' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const alreadyReviewed = product.reviews.find(
    r => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ error: 'You have already reviewed this product.' });
  }

  product.reviews.push({
    user: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    rating: Number(rating),
    comment,
  });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews;

  await product.save();
  res.status(201).json({ message: 'Review added.' });
});

module.exports = router;
