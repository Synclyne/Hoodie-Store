require('dotenv').config();
require('express-async-errors');
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const connectDB   = require('./utils/db');
const ensureAdmin  = require('./utils/ensureAdmin');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const orderRoutes    = require('./routes/orders');
const adminRoutes    = require('./routes/admin');
const paymentRoutes  = require('./routes/payments');
const homepageRoutes = require('./routes/homepage');
const couponRoutes   = require('./routes/coupons');
const wishlistRoutes = require('./routes/wishlist');
const stockNotifyRoutes = require('./routes/stockNotify');
const shippingRoutes = require('./routes/shipping');
const settingsRoutes = require('./routes/settings');
const newsletterRoutes = require('./routes/newsletter');
const supportRoutes = require('./routes/support');

const app = express();
app.set('trust proxy', 1);

const toOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

const clientOrigins = [...new Set([
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].map(toOrigin).filter(Boolean))];
const isProduction = process.env.NODE_ENV === 'production';
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
const corsOrigin = (origin, callback) => {
  if (!origin || clientOrigins.includes(origin) || (!isProduction && isLocalDevOrigin(origin))) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin ${origin} is not allowed by CORS`));
};
const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

// ─── Connect Database ─────────────────────────────
connectDB().then(() => ensureAdmin().catch(err => {
  console.error(`Admin bootstrap failed: ${err.message}`);
}));

// ─── Security Middleware ──────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions));

// ─── Rate Limiting ────────────────────────────────
// Auth endpoints — strict (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  message: { error: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Admin endpoints — generous (store owner adding lots of products)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many admin requests, please slow down.' },
});
app.use('/api/admin/', adminLimiter);

// Public API — moderate
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 2000,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) =>
    req.path === '/health' ||
    req.path.startsWith('/admin') ||
    req.path.startsWith('/auth'),
});
app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Static files (uploaded images) ──────────────
app.use('/uploads', express.static('uploads'));

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stock-notify', stockNotifyRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/support', supportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// ─── Error Handlers ──────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 HOODIE Store API running on port ${PORT}`);
  console.log(`   Env: ${process.env.NODE_ENV}`);
  console.log(`   CORS: ${clientOrigins.join(', ')}\n`);
});

module.exports = app;
