const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── Detect whether Cloudinary is configured ─────────────
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;
let deleteImage = async () => {}; // no-op by default
let cloudinary  = null;

if (cloudinaryConfigured) {
  // ── Cloudinary mode ──────────────────────────────────
  const _cloudinary          = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  _cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: _cloudinary,
    params: async (req, file) => ({
      folder:          'hoodie-store/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    }),
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  deleteImage = async (publicId) => {
    try { await _cloudinary.uploader.destroy(publicId); }
    catch (err) { console.error('Cloudinary delete error:', err.message); }
  };

  cloudinary = _cloudinary;
  console.log('✅ Image storage: Cloudinary');

} else {
  // ── Local disk fallback ──────────────────────────────
  // Ensure uploads/ directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);
      cb(ok ? null : new Error('Only JPG, PNG and WebP images are allowed'), ok);
    },
  });

  console.log('⚠️  Image storage: local disk (uploads/). Add Cloudinary keys to .env for CDN.');
}

module.exports = { upload, deleteImage, cloudinary };