const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  line1:     { type: String, required: true },
  line2:     { type: String, default: '' },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  postalCode:{ type: String, required: true },
  country:   { type: String, required: true, default: 'KE' },
  phone:     { type: String, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  adminType: {
    type: String,
    enum: ['owner', 'staff'],
    default: 'owner',
  },
  adminPermissions: {
    type: [String],
    default: [],
  },
  addresses: [addressSchema],
  defaultAddress: { type: Number, default: 0 },
  stripeCustomerId: { type: String, select: false },
  isActive: { type: Boolean, default: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
