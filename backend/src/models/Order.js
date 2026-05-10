const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name:      { type: String, required: true },
  image:     { type: String, default: '' },
  price:     { type: Number, required: true },
  size:      { type: String, required: true },
  color:     { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
}, { _id: false });

const addressSnapshot = new mongoose.Schema({
  fullName:   String,
  line1:      String,
  line2:      String,
  city:       String,
  state:      String,
  postalCode: String,
  country:    String,
  phone:      String,
}, { _id: false });

const deliveryLocationSnapshot = new mongoose.Schema({
  lat:      Number,
  lng:      Number,
  accuracy: Number,
  mapsUrl:  String,
  capturedAt: Date,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  shippingAddress: { type: addressSnapshot, required: true },
  deliveryLocation: { type: deliveryLocationSnapshot, default: null },
  // Pricing breakdown
  subtotal:  { type: Number, required: true },
  shipping:  { type: Number, required: true, default: 0 },
  tax:       { type: Number, required: true, default: 0 },
  discount:  { type: Number, required: true, default: 0 },
  couponCode:{ type: String, default: '' },
  total:     { type: Number, required: true },
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod:        { type: String, default: 'flutterwave' },
  flutterwaveTxRef:     { type: String, unique: true, sparse: true },
  flutterwaveTxId:      { type: String, unique: true, sparse: true },
  // Fulfillment
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  trackingNumber:  { type: String, default: '' },
  trackingCarrier: { type: String, default: '' },
  // Notes
  customerNote: { type: String, default: '' },
  adminNote:    { type: String, default: '' },
  cancellationRequested:   { type: Boolean, default: false },
  cancellationReason:      { type: String, default: '' },
  cancellationRequestedAt: Date,
  // Timeline
  confirmedAt: Date,
  shippedAt:   Date,
  deliveredAt: Date,
  cancelledAt: Date,
}, {
  timestamps: true,
});

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `HD-${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
