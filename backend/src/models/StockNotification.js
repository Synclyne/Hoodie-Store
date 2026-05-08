const mongoose = require('mongoose');

const stockNotificationSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId },   // specific variant (size/colour)
  email:     { type: String, required: true, lowercase: true, trim: true },
  name:      { type: String, default: '' },
  notified:  { type: Boolean, default: false },          // prevents duplicate emails
  notifiedAt:{ type: Date },
}, { timestamps: true });

stockNotificationSchema.index({ product: 1, variantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('StockNotification', stockNotificationSchema);
