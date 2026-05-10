const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size:     { type: String, required: true },
  color:    { type: String, required: true },
  colorHex: { type: String, default: '#000000' },
  stock:    { type: Number, required: true, min: 0, default: 0 },
  sku:      { type: String },
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  approved:{ type: Boolean, default: false },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  details:     { type: String, default: '' },

  price:       { type: Number, required: true, min: 0 },
  comparePrice:{ type: Number, default: null },

  images: [{
    url:  { type: String, required: true },
    alt:  { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  }],

  category: {
    type: String,
    enum: ['hoodie', 'sweatshirt', 'outwear', 'athletic', 'shoes', 'accessories'],
    required: true,
  },

  gender: {
    type: String,
    enum: ['men', 'women', 'unisex', 'kids'],
    required: true,
  },

  tags:     [{ type: String, lowercase: true }],
  variants: [variantSchema],

  // derived fields (NOT stored manually)
  sizes:  [String],
  colors: [String],

  reviews:    [reviewSchema],
  rating:     { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },

  badge: {
    type: String,
    enum: ['', 'bestseller', 'new', 'sale', 'limited'],
    default: '',
  },

  isPublished: { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  weight:      { type: Number, default: 500 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


// ✅ ALWAYS correct stock (even after edits)
productSchema.virtual('totalStock').get(function () {
  if (!this.variants) return 0;
  return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});


// ✅ Keep sizes & colors synced
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length) {
    this.sizes  = [...new Set(this.variants.map(v => v.size))];
    this.colors = [...new Set(this.variants.map(v => v.color))];
  }

  // Auto badge for sale items
  if (
    this.comparePrice &&
    this.comparePrice > this.price &&
    this.badge !== 'new' &&
    this.badge !== 'limited'
  ) {
    this.badge = 'sale';
  }

  next();
});


// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, gender: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
