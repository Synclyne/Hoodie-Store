const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId:{ type: mongoose.Schema.Types.ObjectId, required: true },
  name:     { type: String, required: true },
  image:    { type: String, default: '' },
  price:    { type: Number, required: true },
  size:     { type: String, required: true },
  color:    { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Virtual: subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual: total items count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
