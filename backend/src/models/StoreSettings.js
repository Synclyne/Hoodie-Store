const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  instagram: { type: String, default: 'https://www.instagram.com/' },
  telegram:  { type: String, default: 'https://t.me/' },
  facebook:  { type: String, default: 'https://www.facebook.com/' },
  x:         { type: String, default: 'https://x.com/' },
}, { _id: false });

const policyLinksSchema = new mongoose.Schema({
  returns:  { type: String, default: '' },
  shipping: { type: String, default: '' },
  privacy:  { type: String, default: '' },
  terms:    { type: String, default: '' },
}, { _id: false });

const storeSettingsSchema = new mongoose.Schema({
  storeName:        { type: String, default: 'HOODIE' },
  logoUrl:          { type: String, default: '' },
  supportEmail:     { type: String, default: '' },
  whatsappNumber:   { type: String, default: '254700000000' },
  currencyCode:     { type: String, default: 'KES' },
  currencyLabel:    { type: String, default: 'KSh' },
  freeShippingVisible: { type: Boolean, default: true },
  freeShippingText: { type: String, default: 'FREE SHIPPING ON ORDERS OVER KSh 5,000' },
  locationName:     { type: String, default: '' },
  locationAddress:  { type: String, default: '' },
  mapEmbedUrl:      { type: String, default: '' },
  socialLinks:      { type: socialLinksSchema, default: () => ({}) },
  policyLinks:      { type: policyLinksSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
