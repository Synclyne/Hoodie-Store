require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const SAMPLE_PRODUCTS = [
  {
    name: 'Vintage Wash Oversized Hoodie',
    slug: 'vintage-wash-oversized-hoodie',
    description: 'Relaxed, washed-out silhouette with premium 380gsm fleece. The perfect everyday oversized hoodie.',
    details: '380gsm cotton-polyester fleece | Drop shoulder fit | Kangaroo pocket | Ribbed cuffs and hem | Machine wash cold',
    price: 2800,
    comparePrice: null,
    category: 'hoodie',
    gender: 'unisex',
    badge: 'bestseller',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800', alt: 'Vintage Wash Hoodie', isPrimary: true }],
    variants: [
      { size: 'S', color: 'Cream', colorHex: '#c5b99a', stock: 15 },
      { size: 'M', color: 'Cream', colorHex: '#c5b99a', stock: 20 },
      { size: 'L', color: 'Cream', colorHex: '#c5b99a', stock: 18 },
      { size: 'XL', color: 'Cream', colorHex: '#c5b99a', stock: 12 },
      { size: 'S', color: 'Black', colorHex: '#1a1a1a', stock: 10 },
      { size: 'M', color: 'Black', colorHex: '#1a1a1a', stock: 25 },
      { size: 'L', color: 'Black', colorHex: '#1a1a1a', stock: 20 },
      { size: 'XL', color: 'Black', colorHex: '#1a1a1a', stock: 8 },
    ],
    tags: ['hoodie', 'vintage', 'oversized', 'bestseller'],
  },
  {
    name: 'Graphic Print Hoodie',
    slug: 'graphic-print-hoodie',
    description: 'Bold collegiate graphic on a heavyweight 400gsm cotton blend. A statement piece for every wardrobe.',
    details: '400gsm cotton blend | Oversized fit | Double-lined hood | Reinforced stitching | Screen print graphic',
    price: 3200,
    comparePrice: 4000,
    category: 'hoodie',
    gender: 'men',
    badge: 'sale',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', alt: 'Graphic Print Hoodie', isPrimary: true }],
    variants: [
      { size: 'S', color: 'Green', colorHex: '#7ab87a', stock: 12 },
      { size: 'M', color: 'Green', colorHex: '#7ab87a', stock: 18 },
      { size: 'L', color: 'Green', colorHex: '#7ab87a', stock: 15 },
      { size: 'XL', color: 'Green', colorHex: '#7ab87a', stock: 8 },
      { size: 'S', color: 'Black', colorHex: '#1a1a1a', stock: 10 },
      { size: 'M', color: 'Black', colorHex: '#1a1a1a', stock: 14 },
    ],
    tags: ['hoodie', 'graphic', 'print', 'mens'],
  },
  {
    name: 'Classic Crewneck Sweatshirt',
    slug: 'classic-crewneck-sweatshirt',
    description: 'The essential crewneck. 350gsm cotton-polyester fleece, boxy fit. The everyday uniform.',
    details: '350gsm cotton-polyester | Boxy fit | Ribbed collar, cuffs, and hem | No hood | Minimal branding',
    price: 2000,
    comparePrice: null,
    category: 'sweatshirt',
    gender: 'unisex',
    badge: 'new',
    isFeatured: false,
    images: [{ url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800', alt: 'Classic Crewneck', isPrimary: true }],
    variants: [
      { size: 'XS', color: 'Gray', colorHex: '#a8a8a8', stock: 8 },
      { size: 'S', color: 'Gray', colorHex: '#a8a8a8', stock: 15 },
      { size: 'M', color: 'Gray', colorHex: '#a8a8a8', stock: 22 },
      { size: 'L', color: 'Gray', colorHex: '#a8a8a8', stock: 18 },
      { size: 'XL', color: 'Gray', colorHex: '#a8a8a8', stock: 10 },
      { size: 'S', color: 'Black', colorHex: '#1a1a1a', stock: 20 },
      { size: 'M', color: 'Black', colorHex: '#1a1a1a', stock: 25 },
      { size: 'L', color: 'Black', colorHex: '#1a1a1a', stock: 18 },
    ],
    tags: ['sweatshirt', 'crewneck', 'classic', 'unisex'],
  },
  {
    name: 'Pastel Crop Hoodie',
    slug: 'pastel-crop-hoodie',
    description: 'Cropped silhouette in 360gsm brushed fleece. Adjustable drawcord, oversized hood. Perfect for layered looks.',
    details: '360gsm brushed fleece | Cropped fit | Adjustable drawcord | Kangaroo pocket | Ribbed hem',
    price: 2200,
    comparePrice: 2800,
    category: 'hoodie',
    gender: 'women',
    badge: 'sale',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', alt: 'Pastel Crop Hoodie', isPrimary: true }],
    variants: [
      { size: 'XS', color: 'Pink', colorHex: '#d8a0b0', stock: 10 },
      { size: 'S', color: 'Pink', colorHex: '#d8a0b0', stock: 15 },
      { size: 'M', color: 'Pink', colorHex: '#d8a0b0', stock: 12 },
      { size: 'L', color: 'Pink', colorHex: '#d8a0b0', stock: 8 },
      { size: 'XS', color: 'Yellow', colorHex: '#f0e0a0', stock: 6 },
      { size: 'S', color: 'Yellow', colorHex: '#f0e0a0', stock: 10 },
      { size: 'M', color: 'Yellow', colorHex: '#f0e0a0', stock: 8 },
    ],
    tags: ['hoodie', 'crop', 'womens', 'pastel'],
  },
  {
    name: 'Quilted Puffer Jacket',
    slug: 'quilted-puffer-jacket',
    description: 'Water-resistant quilted shell with recycled insulation. Packable into its own pocket.',
    details: 'Water-resistant nylon shell | Recycled fill insulation | Packable | 2 zippered hand pockets | Adjustable hem | Machine wash',
    price: 6500,
    comparePrice: 8000,
    category: 'outwear',
    gender: 'unisex',
    badge: 'sale',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800', alt: 'Quilted Puffer', isPrimary: true }],
    variants: [
      { size: 'S', color: 'Black', colorHex: '#1a1a1a', stock: 8 },
      { size: 'M', color: 'Black', colorHex: '#1a1a1a', stock: 12 },
      { size: 'L', color: 'Black', colorHex: '#1a1a1a', stock: 10 },
      { size: 'XL', color: 'Black', colorHex: '#1a1a1a', stock: 6 },
      { size: 'S', color: 'Navy', colorHex: '#7a9ab8', stock: 5 },
      { size: 'M', color: 'Navy', colorHex: '#7a9ab8', stock: 8 },
      { size: 'L', color: 'Navy', colorHex: '#7a9ab8', stock: 7 },
    ],
    tags: ['outwear', 'puffer', 'winter', 'jacket'],
  },
  {
    name: 'Athletic Performance Pullover',
    slug: 'athletic-performance-pullover',
    description: 'Technical fleece pullover for movement. Moisture-wicking 280gsm fabric with thumbhole cuffs.',
    details: '280gsm moisture-wicking fleece | Regular fit | Thumbhole cuffs | Quarter-zip | Reflective logo | Quick-dry',
    price: 3800,
    comparePrice: null,
    category: 'athletic',
    gender: 'men',
    badge: null,
    isFeatured: false,
    images: [{ url: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800', alt: 'Athletic Pullover', isPrimary: true }],
    variants: [
      { size: 'XS', color: 'Rust', colorHex: '#c8785a', stock: 6 },
      { size: 'S', color: 'Rust', colorHex: '#c8785a', stock: 12 },
      { size: 'M', color: 'Rust', colorHex: '#c8785a', stock: 18 },
      { size: 'L', color: 'Rust', colorHex: '#c8785a', stock: 15 },
      { size: 'XL', color: 'Rust', colorHex: '#c8785a', stock: 8 },
    ],
    tags: ['athletic', 'performance', 'pullover', 'sport'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }),
    ]);
    console.log('Cleared existing data');

    // Create admin user
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        firstName: 'Store',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@hoodie.store',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
        role: 'admin',
      });
      await Cart.create({ user: admin._id, items: [] });
      console.log(`✅ Admin created: ${admin.email}`);
    }

    // Create products
    const products = await Product.insertMany(SAMPLE_PRODUCTS);
    console.log(`✅ ${products.length} products seeded`);

    // Create a sample customer
    const customer = await User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'customer@example.com',
      password: 'Customer123!',
      role: 'customer',
    });
    await Cart.create({ user: customer._id, items: [] });
    console.log(`✅ Sample customer: ${customer.email} / Customer123!`);

    console.log('\n✅ Seed complete!\n');
    console.log('Login credentials:');
    console.log(`  Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
    console.log(`  Customer: customer@example.com / Customer123!\n`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
