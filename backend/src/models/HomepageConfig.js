const mongoose = require('mongoose');

const featuredCardSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, required: true },
  bg:       { type: String, default: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)' },
  imageUrl: { type: String, default: '' }, // overrides gradient if set
  dark:     { type: Boolean, default: false },
}, { _id: false });

const bannerSchema = new mongoose.Schema({
  heading:    { type: String, default: 'FULL WINTERS' },
  subheading: { type: String, default: 'Premium fleece-lined hoodies designed for cold weather.' },
  ctaLabel:   { type: String, default: 'NEW COLLECTION // LIMITED EDITION' },
  ctaLink:    { type: String, default: '/shop' },
  bgLeft:     { type: String, default: 'linear-gradient(180deg,#111,#333)' },
  bgRight:    { type: String, default: 'linear-gradient(180deg,#c8b89a,#a89070)' },
  imageUrlLeft:  { type: String, default: '' },
  imageUrlRight: { type: String, default: '' },
}, { _id: false });

// Custom sections — admin can add as many as they want
// type: 'banner' | 'text' | 'image_text' | 'cta'
const customSectionSchema = new mongoose.Schema({
  id:       { type: String, required: true }, // client-generated UUID for ordering
  type:     { type: String, enum: ['banner', 'text', 'image_text', 'cta', 'product_carousel'], default: 'banner' },
  visible:  { type: Boolean, default: true },
  // Banner / image_text fields
  heading:  { type: String, default: '' },
  subtext:  { type: String, default: '' },
  bgLeft:   { type: String, default: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)' },
  bgRight:  { type: String, default: 'linear-gradient(160deg,#c5b99a,#e8dcc8)' },
  imageUrl: { type: String, default: '' },
  imageSide:{ type: String, enum: ['left', 'right'], default: 'left' },
  // CTA / text fields
  ctaLabel: { type: String, default: 'SHOP NOW' },
  ctaLink:  { type: String, default: '/shop' },
  // Text-only
  body:     { type: String, default: '' },
  // Shared
  darkText: { type: Boolean, default: false },
  order:    { type: Number, default: 0 },
  // Product carousel — store product IDs or a category slug
  productIds:      { type: [String], default: [] },
  carouselCategory:{ type: String, default: '' }, // if set, loads from this category
}, { _id: false });

const homepageConfigSchema = new mongoose.Schema({
  announcementText:    { type: String, default: 'FREE SHIPPING ON ORDERS OVER KSh 5,000 ✦ NEW COLLECTION NOW LIVE' },
  announcementVisible: { type: Boolean, default: true },
  // Hero slides — supports multiple slides that auto-scroll
  heroSlides: {
    type: [{
      tagline:   { type: String, default: 'THE BEST HOODIES ARE ONLY HERE' },
      title:     { type: String, default: 'HOODIE' },
      ctaLabel:  { type: String, default: 'DISCOVER NOW' },
      ctaLink:   { type: String, default: '/shop' },
      category:  { type: String, default: 'hoodie' },
      imageUrl:  { type: String, default: '' },  // optional background image
      bgColor:   { type: String, default: 'linear-gradient(135deg,#c8c2b8,#a89f93,#d4cdc5)' },
      darkText:  { type: Boolean, default: false },
    }],
    default: [],
  },
  heroTagline:         { type: String, default: 'THE BEST HOODIES ARE ONLY HERE' },
  heroTitle:           { type: String, default: 'HOODIE' },
  heroCtaLabel:        { type: String, default: 'DISCOVER NOW' },
  heroCtaLink:         { type: String, default: '/shop' },
  tickerText:          { type: String, default: 'THE BEST HOODIES CLOTHING 2025 ✦' },
  tickerVisible:       { type: Boolean, default: true },
  featuredCards: {
    type: [featuredCardSchema],
    default: [
      { title: 'OVERSIZED GRAPHIC HOODIES', category: 'hoodie',      bg: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)', dark: false },
      { title: 'CAPS & BAGS',               category: 'accessories', bg: 'linear-gradient(160deg,#2d4a2d,#4a7a4a)', dark: false },
      { title: 'STREETWEAR OUTWEAR',        category: 'outwear',     bg: 'linear-gradient(160deg,#c5b99a,#e8dcc8)', dark: true  },
    ],
  },
  collectionTitle:   { type: String, default: 'OUR COLLECTION' },
  collectionSubtext: { type: String, default: 'Premium streetwear hoodies, sweatshirts and outwear for every season.' },
  banner:            { type: bannerSchema, default: () => ({}) },
  // Custom extra sections — rendered below the main banner
  // sectionOrder: controls which sections appear between Hero+FeaturedProducts and Newsletter,
  // and in what order. Fixed keys: 'ticker','cards','collection','banner'. Custom section ids also valid.
  sectionOrder:      { type: [String], default: ['ticker', 'cards', 'collection', 'banner'] },
  customSections:    { type: [customSectionSchema], default: [] },
  newsletterHeading: { type: String, default: 'SUBSCRIBE OUR NEWSLETTER' },
  newsletterSubtext: { type: String, default: 'GET 10% OFF YOUR FIRST ORDER' },
}, { timestamps: true });

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
