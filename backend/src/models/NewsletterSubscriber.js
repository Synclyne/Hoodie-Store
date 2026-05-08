const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  confirmedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
