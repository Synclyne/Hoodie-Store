const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:        { type: String, enum: ['percentage', 'fixed'], required: true },
  value:       { type: Number, required: true, min: 0 },        // % or KSh amount
  minOrder:    { type: Number, default: 0 },                    // minimum cart value
  maxUses:     { type: Number, default: null },                  // null = unlimited
  usedCount:   { type: Number, default: 0 },
  usedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  onePerUser:  { type: Boolean, default: true },
  expiresAt:   { type: Date, default: null },                   // null = never
  isActive:    { type: Boolean, default: true },
  description: { type: String, default: '' },
}, { timestamps: true });

// Check if coupon is valid for a user + cart amount
couponSchema.methods.validate = function(userId, cartTotal) {
  if (!this.isActive) return { valid: false, error: 'This coupon is no longer active.' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, error: 'This coupon has expired.' };
  if (this.maxUses !== null && this.usedCount >= this.maxUses) return { valid: false, error: 'This coupon has reached its usage limit.' };
  if (cartTotal < this.minOrder) return { valid: false, error: `Minimum order of KSh ${this.minOrder.toLocaleString()} required.` };
  if (this.onePerUser && this.usedBy.some(id => id.toString() === userId?.toString())) return { valid: false, error: 'You have already used this coupon.' };
  return { valid: true };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(cartTotal) {
  if (this.type === 'percentage') return Math.round(cartTotal * (this.value / 100));
  return Math.min(this.value, cartTotal); // fixed — can't discount more than total
};

module.exports = mongoose.model('Coupon', couponSchema);
