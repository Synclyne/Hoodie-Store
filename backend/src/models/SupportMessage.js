const mongoose = require('mongoose');

const supportThreadMessageSchema = new mongoose.Schema({
  author: { type: String, enum: ['customer', 'admin'], required: true },
  body:   { type: String, required: true, trim: true, maxlength: 4000 },
  sentBy: { type: String, trim: true, maxlength: 160, default: '' },
  emailed:{ type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const supportMessageSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 120 },
  email:      { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  phone:      { type: String, trim: true, maxlength: 40, default: '' },
  orderNumber:{ type: String, trim: true, maxlength: 80, default: '' },
  subject:    { type: String, required: true, trim: true, maxlength: 160 },
  message:    { type: String, required: true, trim: true, maxlength: 4000 },
  accessToken:{ type: String, default: undefined },
  thread:     { type: [supportThreadMessageSchema], default: [] },
  status:     { type: String, enum: ['new', 'open', 'resolved', 'closed'], default: 'new' },
  adminNote:  { type: String, trim: true, maxlength: 2000, default: '' },
  lastCustomerReplyAt: { type: Date, default: null },
  lastAdminReplyAt:    { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

supportMessageSchema.index({ status: 1, createdAt: -1 });
supportMessageSchema.index({ email: 1, createdAt: -1 });
supportMessageSchema.index({ accessToken: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
