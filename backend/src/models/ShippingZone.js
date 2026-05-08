const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  name:      { type: String, required: true },   // e.g. "Nairobi CBD", "Rest of Kenya"
  regions:   [{ type: String }],                  // city/county names for display
  price:     { type: Number, required: true },    // KSh
  freeOver:  { type: Number, default: null },     // free shipping if order > this amount
  minDays:   { type: Number, default: 1 },
  maxDays:   { type: Number, default: 5 },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
