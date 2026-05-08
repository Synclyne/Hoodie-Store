const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema({
  url: { type: String, required: true },
  originalName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
  source: { type: String, enum: ['cloudinary', 'local', 'external'], default: 'local' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

mediaAssetSchema.index({ createdAt: -1 });
mediaAssetSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
