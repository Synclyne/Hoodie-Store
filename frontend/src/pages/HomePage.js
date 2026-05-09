import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from '../next/ReactRouterCompat';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import useMediaQuery from '../hooks/useMediaQuery';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { HomeSkeleton } from '../components/Skeleton';

const DEFAULT_CONFIG = {
  siteBackgroundColor: '#f5f3ef',
  siteBackgroundImage: '',
  announcementText: 'FREE SHIPPING ON ORDERS OVER KSh 5,000 ✦ NEW COLLECTION NOW LIVE',
  announcementVisible: true,
  heroTagline: 'THE BEST HOODIES ARE ONLY HERE',
  heroTitle: 'HOODIE',
  heroCtaLabel: 'DISCOVER NOW',
  heroCtaLink: '/shop',
  heroSlides: [],
  tickerText: 'THE BEST HOODIES CLOTHING 2025 ✦',
  tickerVisible: true,
  featuredCards: [
    {
      title: 'OVERSIZED GRAPHIC HOODIES',
      category: 'hoodie',
      bg: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)',
      dark: false,
    },
    {
      title: 'CAPS & BAGS',
      category: 'accessories',
      bg: 'linear-gradient(160deg,#2d4a2d,#4a7a4a)',
      dark: false,
    },
    {
      title: 'STREETWEAR OUTWEAR',
      category: 'outwear',
      bg: 'linear-gradient(160deg,#c5b99a,#e8dcc8)',
      dark: true,
    },
  ],
  collectionTitle: 'OUR COLLECTION',
  collectionSubtext:
    'Premium streetwear hoodies, sweatshirts and outwear for every season.',
  banner: {
    heading: 'FULL WINTERS',
    subheading:
      'Premium fleece-lined hoodies designed for cold weather. Wind-resistant, insulated, and built to last.',
    ctaLabel: 'NEW COLLECTION // LIMITED EDITION',
    ctaLink: '/shop',
    bgLeft: 'linear-gradient(180deg,#111,#333)',
    bgRight: 'linear-gradient(180deg,#c8b89a,#a89070)',
    imageUrlLeft: '',
    imageUrlRight: '',
  },
  customSections: [],
  newsletterHeading: 'SUBSCRIBE OUR NEWSLETTER',
  newsletterSubtext: 'GET 10% OFF YOUR FIRST ORDER',
};

function TabLink({ label, to, isMobile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: isMobile ? 9 : 10,
        letterSpacing: 1,
        padding: isMobile ? '7px 14px' : '7px 18px',
        border: '1px solid #0a0a0a',
        color: hovered ? '#f5f3ef' : '#0a0a0a',
        background: hovered ? '#0a0a0a' : 'transparent',
        display: 'inline-block',
        textDecoration: 'none',
        transition: 'background .2s, color .2s',
      }}
    >
      {label}
    </Link>
  );
}

function FeaturedCard({ card, onClick, isMobile, fullWidth }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: isMobile ? 180 : 320,
        background: card.imageUrl ? 'transparent' : card.bg,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        ...(fullWidth ? { gridColumn: 'span 2' } : {}),
      }}
    >
      {/* Background image (if set) */}
      {card.imageUrl && (
        <img
          src={card.imageUrl}
          alt={card.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform .4s',
          }}
        />
      )}
      {/* Dark overlay when image is set so text is readable */}
      {card.imageUrl && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,.1) 60%, rgba(0,0,0,.5) 100%)' }} />
      )}

      {/* Title */}
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, zIndex: 2 }}>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 16 : 18, lineHeight: 1.1, textTransform: 'uppercase', color: (card.imageUrl || !card.dark) ? '#f5f3ef' : '#0a0a0a' }}>
          {card.title}
        </h3>
      </div>

      {/* Explore button */}
      <button
        style={{
          position: 'absolute', bottom: 12, left: 14,
          fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1,
          padding: '5px 10px', border: 'none', cursor: 'pointer',
          background: hovered ? (card.dark && !card.imageUrl ? '#f5f3ef' : '#0a0a0a') : (card.dark && !card.imageUrl ? '#0a0a0a' : '#f5f3ef'),
          color:      hovered ? (card.dark && !card.imageUrl ? '#0a0a0a' : '#f5f3ef') : (card.dark && !card.imageUrl ? '#f5f3ef' : '#0a0a0a'),
          transition: 'background .2s, color .2s',
          zIndex: 2,
        }}
      >
        EXPLORE
      </button>
    </div>
  );
}

// ─── Reusable horizontal product carousel (same style as the screenshots) ────
function SocialLink({ platform, href, icon }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 34,
        height: 34,
        border: '1px solid #d0cdc9',
        color: '#0a0a0a',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        position: 'relative',
        background: hovered ? '#0a0a0a' : 'transparent',
        transition: 'background .2s',
      }}
      aria-label={platform}
      title={platform}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ color: hovered ? '#f5f3ef' : '#0a0a0a' }}>
        {icon}
      </svg>
      <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1, background: '#0a0a0a', color: '#f5f3ef', padding: '4px 7px', opacity: hovered ? 1 : 0, pointerEvents: 'none', whiteSpace: 'nowrap', transition: 'opacity .2s' }}>
        {platform}
      </span>
    </a>
  );
}

const SOCIAL_ICONS = {
  Instagram: <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.7 2.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
  Telegram: <path d="M21.8 4.4 18.5 20c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L7 14 2.4 12.6c-1-.3-1-1 .2-1.5L20.4 4.2c.9-.3 1.6.2 1.4 1.2Z" />,
  Facebook: <path d="M14 8h3V4h-3c-3.1 0-5 1.9-5 5v3H6v4h3v6h4v-6h3.2l.8-4h-4V9c0-.7.3-1 1-1Z" />,
  X: <path d="M18.7 2h3.1l-6.8 7.8L23 22h-6.5l-5.1-6.7L5.6 22H2.5l7.3-8.4L2 2h6.7l4.6 6.1L18.7 2Zm-1.1 17.9h1.7L7.8 4H6l11.6 15.9Z" />,
};

function getMapEmbedSrc(value) {
  if (!value) return '';
  const match = String(value).match(/src=["']([^"']+)["']/i);
  return match ? match[1] : value;
}

function advanceCarousel(el, speed, carryRef) {
  carryRef.current += speed;
  const pixels = Math.floor(carryRef.current);
  if (pixels < 1) return;
  carryRef.current -= pixels;
  el.scrollLeft += pixels;
}

function ProductCarousel({ heading, shopAllLink, shopAllLabel, products, scrollRef, isMobile }) {
  const innerRef = scrollRef || React.useRef(null);
  const rafRef   = React.useRef(null);
  const hovered  = React.useRef(false);
  const carryRef = React.useRef(0);
  const CARD_W   = isMobile ? 180 : 281;

  // Smooth RAF auto-scroll — runs continuously, pauses on hover
  React.useEffect(() => {
    if (!products.length) return;
    const speed = isMobile ? 0.65 : 0.85;

    const tick = () => {
      const el = innerRef.current;
      if (el && !hovered.current) {
        advanceCarousel(el, speed, carryRef);
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [products, isMobile, innerRef]);

  const scrollBy = (dir) => {
    const el = innerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + dir * CARD_W, behavior: 'smooth' });
  };

  return (
    <section style={{ padding: isMobile ? '28px 0' : '40px 0', borderTop: '1px solid #d0cdc9' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: isMobile ? '0 16px 16px' : '0 28px 20px' }}>
        <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 'clamp(28px,8vw,48px)' : 'clamp(36px,5vw,56px)', lineHeight: 1 }}>
          {heading}
        </h2>
        {shopAllLink && (
          <Link to={shopAllLink} style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 8 : 10, letterSpacing: 1, color: '#0a0a0a', textDecoration: 'none', borderBottom: '1px solid #0a0a0a', paddingBottom: 1, whiteSpace: 'nowrap' }}>
            {shopAllLabel || 'SHOP ALL'} →
          </Link>
        )}
      </div>

      {/* Scrollable row with prev/next arrows */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => scrollBy(-1)} style={arrowBtnStyle('left')}>‹</button>

        <div
          ref={innerRef}
          onMouseEnter={() => { hovered.current = true; }}
          onMouseLeave={() => { hovered.current = false; }}
          onTouchStart={isMobile ? undefined : () => { hovered.current = true; }}
          onTouchEnd={isMobile ? undefined : () => { hovered.current = false; }}
          onTouchCancel={isMobile ? undefined : () => { hovered.current = false; }}
          style={{ display: 'flex', overflowX: 'auto', gap: 1, background: '#d0cdc9', scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}
        >
          <style>{`.carousel-track::-webkit-scrollbar{display:none}`}</style>
          {products.map((p, i) => (
            <div key={`${p._id}-${i}`} style={{ flexShrink: 0, width: CARD_W, background: '#f5f3ef' }}>
              <CarouselProductCard product={p} />
            </div>
          ))}
        </div>

        <button onClick={() => scrollBy(1)} style={arrowBtnStyle('right')}>›</button>
      </div>
    </section>
  );
}

const arrowBtnStyle = (side) => ({
  position: 'absolute', [side]: 10, top: '50%', transform: 'translateY(-50%)',
  zIndex: 10, width: 36, height: 36, borderRadius: '50%',
  background: '#f5f3ef', border: '1px solid #d0cdc9', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,.12)',
});

// ─── Slim product card used inside carousels ──────────────
function CarouselProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding] = React.useState(false);
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];
  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : null;
  const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    const v = product.variants?.find(v => v.stock > 0);
    if (!v) return;
    setAdding(true);
    await addToCart(product._id, v._id, 1);
    setAdding(false);
  };

  return (
    <div onClick={() => navigate(`/product/${product.slug}`)} style={{ cursor: 'pointer', background: '#f5f3ef', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <div style={{ aspectRatio: '1', background: '#ede9e3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {primaryImage
          ? <img src={primaryImage.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 40, opacity: .2 }}>👕</span>}
        {product.badge && (
          <span style={{ position: 'absolute', top: 8, left: 8, fontFamily: 'Space Mono, monospace', fontSize: 7, letterSpacing: 1, padding: '2px 6px', background: product.badge === 'sale' ? '#e07000' : '#0a0a0a', color: '#fff' }}>
            {product.badge.toUpperCase()}
          </span>
        )}
        {discount && (
          <span style={{ position: 'absolute', top: 8, right: 8, fontFamily: 'Space Mono, monospace', fontSize: 7, padding: '2px 6px', background: '#e07000', color: '#fff' }}>−{discount}%</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: product.comparePrice ? '#e03030' : '#0a0a0a' }}>{fmt(product.price)}</span>
            {product.comparePrice && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'line-through' }}>{fmt(product.comparePrice)}</span>}
          </div>
        </div>
        <button
          onClick={handleQuickAdd}
          disabled={adding || product.totalStock === 0}
          style={{ marginTop: 8, width: '100%', fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1, padding: '7px', border: '1px solid #0a0a0a', background: product.totalStock === 0 ? '#d0cdc9' : '#0a0a0a', color: '#f5f3ef', cursor: product.totalStock === 0 ? 'not-allowed' : 'pointer' }}
        >
          {product.totalStock === 0 ? 'OUT OF STOCK' : adding ? 'ADDING...' : 'QUICK ADD'}
        </button>
      </div>
    </div>
  );
}

// ─── Trending section — fetches from /api/products/trending ──────────────────
function TrendingSection({ isMobile }) {
  const [products, setProducts] = React.useState([]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    api.get('/products/trending', { params: { limit: 12 } })
      .then(r => setProducts([...r.data.products, ...r.data.products]))
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <ProductCarousel
      heading="TRENDING"
      shopAllLink="/shop?sort=popular"
      shopAllLabel="SHOP ALL"
      products={products}
      scrollRef={scrollRef}
      isMobile={isMobile}
    />
  );
}

// ─── Launch/custom product carousel ─────────────────────
function LaunchCarousel({ sec, isMobile }) {
  const [products, setProducts] = React.useState([]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!sec.visible) return;
    if (sec.productIds?.length) {
      // Fetch specific products by ID
      Promise.all(sec.productIds.map(slug =>
        api.get(`/products/${slug}`).then(r => r.data.product).catch(() => null)
      )).then(results => {
        const valid = results.filter(Boolean);
        setProducts([...valid, ...valid]);
      });
    } else if (sec.carouselCategory) {
      // Fetch by category
      api.get('/products', { params: { category: sec.carouselCategory, limit: 12 } })
        .then(r => { const p = r.data.products; setProducts([...p, ...p]); })
        .catch(() => {});
    }
  }, [sec]);

  if (!products.length) return null;

  return (
    <ProductCarousel
      heading={sec.heading || 'NEW DROP'}
      shopAllLink={sec.ctaLink || '/shop'}
      shopAllLabel={sec.ctaLabel || 'SHOP ALL'}
      products={products}
      scrollRef={scrollRef}
      isMobile={isMobile}
    />
  );
}

function CustomSection({ sec, isMobile, navigate }) {
  if (sec.type === 'banner') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#d0cdc9' }}>
      <div style={{ minHeight: isMobile ? 140 : 300, background: sec.bgLeft }} />
      <div style={{ minHeight: isMobile ? 140 : 300, background: sec.bgRight }} />
      {sec.heading && (
        <div style={{ gridColumn: 'span 2', background: '#f5f3ef', padding: isMobile ? '20px 16px' : '32px 28px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,5vw,56px)', lineHeight: 0.9, color: sec.darkText ? '#0a0a0a' : '#0a0a0a' }}>{sec.heading}</h2>
          {sec.subtext && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginTop: 8 }}>{sec.subtext}</p>}
        </div>
      )}
    </div>
  );

  if (sec.type === 'text') return (
    <section style={{ padding: isMobile ? '40px 16px' : '60px 28px', textAlign: 'center', borderTop: '1px solid #d0cdc9', borderBottom: '1px solid #d0cdc9' }}>
      {sec.heading && <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,6vw,72px)', lineHeight: 0.9, marginBottom: 14 }}>{sec.heading}</h2>}
      {sec.body     && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888', maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.9 }}>{sec.body}</p>}
      {sec.ctaLabel && <Link to={sec.ctaLink} style={{ display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, padding: '12px 24px', border: '1px solid #0a0a0a', color: '#0a0a0a', textDecoration: 'none' }}>{sec.ctaLabel}</Link>}
    </section>
  );

  if (sec.type === 'image_text') {
    const textPanel = (
      <div style={{ padding: isMobile ? '24px 16px' : '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f5f3ef' }}>
        {sec.heading  && <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,4vw,52px)', lineHeight: 0.9, marginBottom: 12, color: sec.darkText ? '#0a0a0a' : '#0a0a0a' }}>{sec.heading}</h2>}
        {sec.subtext  && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', lineHeight: 1.8, marginBottom: 20 }}>{sec.subtext}</p>}
        {sec.ctaLabel && <Link to={sec.ctaLink} style={{ display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, padding: '11px 22px', border: '1px solid #0a0a0a', color: '#0a0a0a', textDecoration: 'none', alignSelf: 'flex-start' }}>{sec.ctaLabel}</Link>}
      </div>
    );
    const imgPanel = sec.imageUrl
      ? <div style={{ minHeight: isMobile ? 200 : 360, backgroundImage: `url(${sec.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      : <div style={{ minHeight: isMobile ? 200 : 360, background: '#ede9e3' }} />;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 1, background: '#d0cdc9' }}>
        {sec.imageSide === 'left' ? <>{imgPanel}{textPanel}</> : <>{textPanel}{imgPanel}</>}
      </div>
    );
  }

  if (sec.type === 'cta') return (
    <section style={{ background: sec.bgLeft, padding: isMobile ? '48px 16px' : '72px 28px', textAlign: 'center' }}>
      {sec.heading  && <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px,7vw,80px)', lineHeight: 0.9, color: sec.darkText ? '#0a0a0a' : '#f5f3ef', marginBottom: 10 }}>{sec.heading}</h2>}
      {sec.subtext  && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: sec.darkText ? '#444' : 'rgba(255,255,255,.7)', marginBottom: 24 }}>{sec.subtext}</p>}
      {sec.ctaLabel && <Link to={sec.ctaLink} style={{ display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: '14px 28px', background: sec.darkText ? '#0a0a0a' : '#f5f3ef', color: sec.darkText ? '#f5f3ef' : '#0a0a0a', textDecoration: 'none' }}>{sec.ctaLabel}</Link>}
    </section>
  );

  if (sec.type === 'product_carousel') {
    return (
      <LaunchCarousel sec={sec} isMobile={isMobile} />
    );
  }

  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { settings } = useSettings();

  const scrollRef = useRef(null);
  const cardsScrollRef = useRef(null);
  const cardsHoveredRef = useRef(false);
  const heroPointerRef = useRef(null);
  const heroLastMoveRef = useRef(0);
  const heroDraggedRef = useRef(false);
  const heroPausedRef = useRef(false);
  const heroResumeTimerRef = useRef(null);

  const [cfg,     setCfg]     = useState(DEFAULT_CONFIG);
  const [featured, setFeatured] = useState([]);
  const [email,   setEmail]   = useState('');
  const [subMsg,  setSubMsg]  = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      api.get('/homepage'),
      api.get('/products/featured'),
    ]).then(([homepageResult, featuredResult]) => {
      if (!alive) return;

      if (homepageResult.status === 'fulfilled') {
        setCfg({ ...DEFAULT_CONFIG, ...homepageResult.value.data.config });
      }
      if (featuredResult.status === 'fulfilled') {
        setFeatured(featuredResult.value.data.products || []);
      }
      setLoadingHome(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) return;

    try {
      await api.post('/newsletter/subscribe', { email });
      setSubMsg('Subscription confirmed. Check your email.');
      setEmail('');
    } catch (err) {
      setSubMsg(err.response?.data?.error || 'Could not subscribe right now.');
    }

    setTimeout(() => setSubMsg(''), 5000);
  };

  const banner = cfg.banner || DEFAULT_CONFIG.banner;
  const loopedProducts = [...featured, ...featured];
  const heroSlides = (cfg.heroSlides?.length ? cfg.heroSlides : [{
    tagline: cfg.heroTagline,
    title: cfg.heroTitle,
    ctaLabel: cfg.heroCtaLabel,
    ctaLink: cfg.heroCtaLink,
    category: 'hoodie',
    imageUrl: cfg.heroImageUrl || '',
    bgColor: 'linear-gradient(135deg,#c8c2b8,#a89f93,#d4cdc5)',
    darkText: false,
  }]);
  const activeHero = heroSlides[heroIndex] || heroSlides[0];
  const heroCtaColor = activeHero?.imageUrl && !activeHero?.darkText ? '#f5f3ef' : '#0a0a0a';
  const mapEmbedSrc = getMapEmbedSrc(settings.mapEmbedUrl);
  const loopedCards = cfg.featuredCards?.length > 1 ? [...cfg.featuredCards, ...cfg.featuredCards] : (cfg.featuredCards || []);
  const siteBackgroundColor = cfg.siteBackgroundColor || DEFAULT_CONFIG.siteBackgroundColor;
  const siteBackgroundImage = cfg.siteBackgroundImage || '';
  const siteBackgroundStyle = {
    backgroundColor: siteBackgroundColor,
    ...(siteBackgroundImage
      ? {
          backgroundImage: `url("${siteBackgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }
      : {}),
  };
  const socialLinks = [
    { platform: 'Instagram', href: settings.socialLinks?.instagram, icon: SOCIAL_ICONS.Instagram },
    { platform: 'Telegram', href: settings.socialLinks?.telegram, icon: SOCIAL_ICONS.Telegram },
    { platform: 'Facebook', href: settings.socialLinks?.facebook, icon: SOCIAL_ICONS.Facebook },
    { platform: 'X', href: settings.socialLinks?.x, icon: SOCIAL_ICONS.X },
  ].filter(link => link.href);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const id = setInterval(() => {
      if (!heroPausedRef.current) {
        setHeroIndex((i) => (i + 1) % heroSlides.length);
      }
    }, 5200);
    return () => {
      clearInterval(id);
      if (heroResumeTimerRef.current) clearTimeout(heroResumeTimerRef.current);
    };
  }, [heroSlides.length]);

  const pauseHeroAuto = (ms = 9000) => {
    heroPausedRef.current = true;
    if (heroResumeTimerRef.current) clearTimeout(heroResumeTimerRef.current);
    heroResumeTimerRef.current = setTimeout(() => {
      heroPausedRef.current = false;
    }, ms);
  };

  const moveHero = (dir) => {
    if (heroSlides.length <= 1) return;
    const now = Date.now();
    if (now - heroLastMoveRef.current < 650) return;
    heroLastMoveRef.current = now;
    pauseHeroAuto();
    setHeroIndex((i) => (i + dir + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (!cfg.featuredCards?.length || cfg.featuredCards.length <= 1) return undefined;

    const speed = isMobile ? 0.65 : 0.85;
    let rafId;
    const carryRef = { current: 0 };

    const tick = () => {
      const el = cardsScrollRef.current;
      if (el && !cardsHoveredRef.current) {
        advanceCarousel(el, speed, carryRef);
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cfg.featuredCards, isMobile]);

  const getHeroOffset = (idx) => {
    if (heroSlides.length <= 1) return 0;
    const raw = idx - heroIndex;
    if (raw > heroSlides.length / 2) return raw - heroSlides.length;
    if (raw < -heroSlides.length / 2) return raw + heroSlides.length;
    return raw;
  };

  const renderHeroVisual = (slide) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: slide.imageUrl ? '#ede9e3' : (slide.bgColor || 'linear-gradient(135deg,#c8c2b8,#a89f93,#d4cdc5)'),
        position: 'relative',
      }}
    >
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
      ) : (
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '90%',
            opacity: 0.28,
          }}
          viewBox="0 0 400 400"
        >
          <ellipse cx="200" cy="140" rx="55" ry="60" fill="#a09080" />
          <path d="M130 220 Q200 200 270 220 L290 400 H110 Z" fill="#b5a898" />
          <ellipse cx="110" cy="130" rx="42" ry="48" fill="#c8bfb0" />
          <path d="M50 210 Q120 190 170 215 L185 400 H35 Z" fill="#cfc4b5" />
          <ellipse cx="290" cy="135" rx="42" ry="48" fill="#b8b0a0" />
          <path d="M230 215 Q280 190 350 210 L365 400 H215 Z" fill="#c0b5a5" />
        </svg>
      )}
    </div>
  );

  if (loadingHome) return <HomeSkeleton />;

  return (
    <main style={siteBackgroundStyle}>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      {/* ── ANNOUNCEMENT ── */}
      {cfg.announcementVisible && (
        <div
          style={{
            background: '#0a0a0a',
            color: '#f5f3ef',
            textAlign: 'center',
            padding: '8px 12px',
            fontFamily: 'Space Mono, monospace',
            fontSize: isMobile ? 8 : 10,
            letterSpacing: 2,
            lineHeight: 1.6,
          }}
        >
          {cfg.announcementText}
        </div>
      )}

      {/* ── HERO ── */}
      <section
        style={{
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: isMobile ? 28 : 22,
        }}
      >
        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 9,
            letterSpacing: 2,
            color: '#888',
            marginBottom: 6,
            padding: '0 16px',
          }}
        >
          {activeHero.tagline}
        </p>

        {/* Title sits cleanly ABOVE the image — no negative margin, no blend */}
        <h1
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isMobile
              ? 'clamp(72px,22vw,120px)'
              : 124,
            lineHeight: 0.85,
            letterSpacing: 0,
            position: 'relative',
            zIndex: 2,
            marginBottom: isMobile ? 16 : 10,
            padding: '0 16px',
          }}
        >
          {activeHero.title}
        </h1>

        {/* Image box sits below — no overlap */}
        <div
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) moveHero(e.deltaX > 0 ? 1 : -1);
          }}
          onMouseEnter={() => { heroPausedRef.current = true; }}
          onMouseLeave={() => { pauseHeroAuto(4000); }}
          onTouchStart={isMobile ? undefined : (e) => { heroPointerRef.current = e.touches[0].clientX; heroDraggedRef.current = false; heroPausedRef.current = true; }}
          onTouchEnd={isMobile ? undefined : (e) => {
            if (heroPointerRef.current == null) return;
            const delta = e.changedTouches[0].clientX - heroPointerRef.current;
            if (Math.abs(delta) > 40) {
              heroDraggedRef.current = true;
              moveHero(delta < 0 ? 1 : -1);
            } else {
              pauseHeroAuto();
            }
            heroPointerRef.current = null;
          }}
          onMouseDown={(e) => { heroPointerRef.current = e.clientX; heroDraggedRef.current = false; heroPausedRef.current = true; }}
          onMouseUp={(e) => {
            if (heroPointerRef.current == null) return;
            const delta = e.clientX - heroPointerRef.current;
            if (Math.abs(delta) > 40) {
              heroDraggedRef.current = true;
              moveHero(delta < 0 ? 1 : -1);
            } else {
              pauseHeroAuto();
            }
            heroPointerRef.current = null;
          }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : 760,
            margin: '0 auto',
            height: isMobile ? 280 : 320,
            overflow: 'hidden',
            cursor: heroSlides.length > 1 ? 'grab' : 'default',
            touchAction: 'pan-y',
          }}
        >
          {heroSlides.length > 1 ? (
            heroSlides.map((slide, idx) => {
              const offset = getHeroOffset(idx);
              const visible = Math.abs(offset) <= 1;
              return (
                <button
                  key={`${slide.title}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (heroDraggedRef.current) {
                      heroDraggedRef.current = false;
                      return;
                    }
                    if (offset !== 0) {
                      pauseHeroAuto();
                      setHeroIndex(idx);
                      return;
                    }
                    navigate(`/shop/${slide.category || 'hoodie'}`);
                  }}
                  aria-label={`Show hero ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: isMobile ? '88%' : '66%',
                    height: '100%',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    overflow: 'hidden',
                    transform: `translateX(calc(-50% + ${offset * (isMobile ? 54 : 62)}%)) scale(${offset === 0 ? 1 : 0.94})`,
                    opacity: visible ? (offset === 0 ? 1 : 0.78) : 0,
                    zIndex: offset === 0 ? 2 : 1,
                    pointerEvents: visible ? 'auto' : 'none',
                    cursor: offset === 0 ? 'grab' : 'pointer',
                    transition: 'transform 900ms cubic-bezier(.22,.61,.36,1), opacity 900ms cubic-bezier(.22,.61,.36,1)',
                  }}
                >
                  {renderHeroVisual(slide)}
                </button>
              );
            })
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/shop/${activeHero.category || 'hoodie'}`)}
              style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' }}
            >
              {renderHeroVisual(activeHero)}
            </button>
          )}

          {/* CTA overlay inside the image */}
          <div
            style={{
              position: 'absolute',
              bottom: isMobile ? 16 : 28,
              left: isMobile ? 16 : 32,
              zIndex: 4,
              textAlign: 'left',
              color: heroCtaColor,
              textShadow: activeHero?.imageUrl ? '0 1px 14px rgba(0,0,0,.35)' : 'none',
            }}
          >
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>
              NEW COLLECTION
            </p>
            <div style={{ width: 120, height: 1, background: heroCtaColor, margin: '6px 0' }} />
            <Link
              to={activeHero.ctaLink || '/shop'}
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, borderBottom: `1px solid ${heroCtaColor}`, textDecoration: 'none', color: heroCtaColor }}
            >
              {activeHero.ctaLabel || 'DISCOVER NOW'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL BAR ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? 16 : 40,
          padding: isMobile ? 14 : 22,
          borderTop: '1px solid #d0cdc9',
          borderBottom: '1px solid #d0cdc9',
          marginTop: 16,
          flexWrap: 'wrap',
        }}
      >
        {socialLinks.map(link => (
          <SocialLink key={link.platform} {...link} />
        ))}
      </div>


      {/* ── FEATURED PRODUCTS — always shown, fixed position ── */}
      {featured.length > 0 && (
        <ProductCarousel
          heading="FEATURED"
          shopAllLink="/shop"
          shopAllLabel="SHOP ALL"
          products={loopedProducts}
          scrollRef={scrollRef}
          isMobile={isMobile}
        />
      )}

      {/* ── TRENDING PRODUCTS — auto populated from orders ── */}


      {/* ── DYNAMIC SECTIONS (ordered by admin) ── */}
      {(cfg.sectionOrder || ['ticker','cards','collection','banner']).map(key => {
        // ── Built-in sections ──
        if (key === 'ticker') return cfg.tickerVisible ? (
          <div key="ticker" style={{ background: '#0a0a0a', color: '#f5f3ef', padding: '10px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 40, animation: 'ticker 20s linear infinite', whiteSpace: 'nowrap' }}>
              {Array(8).fill(cfg.tickerText).map((t, i) => (
                <span key={i} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 3, flexShrink: 0 }}>{t} ✦</span>
              ))}
            </div>
          </div>
        ) : null;

        if (key === 'cards') return (
          <div key="cards" style={{ position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'none',
                gap: 1,
                background: '#d0cdc9',
                /* hide scrollbar */
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'auto',
              }}
              onMouseEnter={() => { cardsHoveredRef.current = true; }}
              onMouseLeave={() => { cardsHoveredRef.current = false; }}
              onTouchStart={isMobile ? undefined : () => { cardsHoveredRef.current = true; }}
              onTouchEnd={isMobile ? undefined : () => { cardsHoveredRef.current = false; }}
              onTouchCancel={isMobile ? undefined : () => { cardsHoveredRef.current = false; }}
              ref={el => {
                cardsScrollRef.current = el;
                if (el) {
                  el.style.setProperty('-webkit-overflow-scrolling', 'touch');
                  /* hide webkit scrollbar via inline style isn't possible, done via className workaround */
                }
              }}
              className="hide-scrollbar"
            >
              {loopedCards.map((card, i) => (
                <div key={`${card.title}-${i}`} style={{ flexShrink: 0, width: isMobile ? '75vw' : `calc(100% / ${Math.min(cfg.featuredCards.length, 3)})`, scrollSnapAlign: 'start' }}>
                  <FeaturedCard card={card} isMobile={isMobile} onClick={() => navigate(`/shop/${card.category}`)} />
                </div>
              ))}
            </div>
          </div>
        );

        if (key === 'collection') return (
          <section key="collection" style={{ padding: isMobile ? '40px 16px 24px' : '80px 28px 40px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 'clamp(52px,16vw,120px)' : 'clamp(60px,14vw,140px)', lineHeight: 0.9, marginBottom: 16 }}>
              {cfg.collectionTitle}
            </h2>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.8 }}>
              {cfg.collectionSubtext}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {[['HOODIES','/shop/hoodie'],['SWEATSHIRTS','/shop/sweatshirt'],['OUTWEAR','/shop/outwear'],['ATHLETIC','/shop/athletic'],['SHOES','/shop/shoes']].map(([label, to]) => (
                <TabLink key={to} label={label} to={to} isMobile={isMobile} />
              ))}
            </div>
          </section>
        );

        if (key === 'banner') {
          const b = cfg.banner || DEFAULT_CONFIG.banner;
          return (
            <section key="banner">
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 16px 28px' : '60px 28px 40px' }}>
                <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 'clamp(44px,14vw,82px)' : 'clamp(60px,14vw,140px)', lineHeight: 0.9 }}>{b.heading}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#d0cdc9', alignItems: 'stretch' }}>
                <div style={{ minHeight: b.imageUrlLeft ? 0 : (isMobile ? 180 : 420), background: b.imageUrlLeft ? '#ede9e3' : b.bgLeft, position: 'relative', overflow: 'hidden' }}>
                  {b.imageUrlLeft && <img src={b.imageUrlLeft} alt={b.heading} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  {!b.imageUrlLeft && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                    <svg width="180" height="280" viewBox="0 0 180 280"><ellipse cx="90" cy="50" rx="38" ry="42" fill="#fff" /><path d="M20 110 Q90 95 160 110 L168 280 H12 Z" fill="#fff" /></svg>
                  </div>}
                </div>
                <div style={{ minHeight: b.imageUrlRight ? 0 : (isMobile ? 180 : 420), background: b.imageUrlRight ? '#ede9e3' : b.bgRight, position: 'relative', overflow: 'hidden' }}>
                  {b.imageUrlRight && <img src={b.imageUrlRight} alt={b.heading} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ gridColumn: '1 / -1', background: siteBackgroundColor, padding: isMobile ? '28px 20px' : '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888', lineHeight: 1.8, marginBottom: 24, maxWidth: 280 }}>{b.subheading}</p>
                  <Link to={b.ctaLink} style={{ display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 9 : 10, letterSpacing: 2, padding: isMobile ? '10px 18px' : '12px 24px', border: '1px solid #0a0a0a', color: '#0a0a0a', textDecoration: 'none' }}>{b.ctaLabel}</Link>
                </div>
              </div>
            </section>
          );
        }

        // ── Custom sections ──
        const sec = (cfg.customSections || []).find(s => s.id === key);
        if (!sec || !sec.visible) return null;
        return <CustomSection key={key} sec={sec} isMobile={isMobile} navigate={navigate} />;
      })}

      <TrendingSection isMobile={isMobile} />

      {(mapEmbedSrc || settings.locationName || settings.locationAddress) && (
        <section
          style={{
            borderTop: '1px solid #d0cdc9',
            background: '#f5f3ef',
            padding: isMobile ? '28px 16px' : '40px 28px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 1, background: '#d0cdc9' }}>
            <div style={{ background: '#f5f3ef', padding: isMobile ? 18 : 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', letterSpacing: 2, marginBottom: 8 }}>STORE LOCATION</p>
              <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 34 : 44, lineHeight: .95, marginBottom: 10 }}>
                {settings.locationName || settings.storeName || 'HOODIE'}
              </h2>
              {settings.locationAddress && (
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#666', lineHeight: 1.8 }}>
                  {settings.locationAddress}
                </p>
              )}
            </div>
            <div style={{ background: '#ede9e3', minHeight: isMobile ? 260 : 360 }}>
              {mapEmbedSrc ? (
                <iframe
                  title="Store location map"
                  src={mapEmbedSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', minHeight: isMobile ? 260 : 360 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      <section
        style={{
          background: '#0a0a0a',
          color: '#f5f3ef',
          padding: isMobile
            ? '56px 16px'
            : '80px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: isMobile ? 120 : 240,
              color: 'rgba(255,255,255,.03)',
              whiteSpace: 'nowrap',
            }}
          >
            {settings.storeName || 'HOODIE'}
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isMobile
              ? 'clamp(36px,12vw,80px)'
              : 'clamp(48px,10vw,100px)',
            lineHeight: 0.9,
            marginBottom: 10,
            position: 'relative',
          }}
        >
          SUBSCRIBE <span style={{ color: '#d4c9b8' }}>OUR</span>
          <br />
          NEWSLETTER
        </h2>

        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 9,
            letterSpacing: 2,
            color: '#888',
            marginBottom: 24,
            position: 'relative',
          }}
        >
          {cfg.newsletterSubtext}
        </p>

        {subMsg ? (
          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 11,
              color: '#d4c9b8',
            }}
          >
            {subMsg}
          </p>
        ) : (
          <form
            onSubmit={handleSubscribe}
            style={{
              display: 'flex',
              maxWidth: 400,
              margin: '0 auto',
              border: '1px solid #333',
              position: 'relative',
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '13px 14px',
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                color: '#f5f3ef',
                minWidth: 0,
              }}
            />

            <button
              type="submit"
              style={{
                background: '#f5f3ef',
                color: '#0a0a0a',
                border: 'none',
                padding: '13px 18px',
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              →
            </button>
          </form>
        )}
      </section>

      <footer
        style={{
          background: '#0a0a0a',
          color: '#f5f3ef',
          borderTop: '1px solid #222',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile
              ? '28px 16px'
              : '24px 32px',
            borderBottom: '1px solid #222',
            gap: 16,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 9,
              color: '#555',
              lineHeight: 1.8,
            }}
          >
            PREMIUM STREETWEAR
            <br />
            SINCE 2020
          </p>

          <span
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: isMobile ? 60 : 80,
              lineHeight: 0.9,
              opacity: 0.08,
            }}
          >
            {settings.storeName || 'HOODIE'}
          </span>

          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 9,
              color: '#555',
              lineHeight: 1.8,
              textAlign: isMobile ? 'center' : 'right',
              minWidth: isMobile ? 'auto' : 180,
            }}
          >
            {settings.freeShippingVisible !== false
              ? (settings.freeShippingText || 'FREE SHIPPING OVER KSH 5,000')
              : 'SECURE CHECKOUT'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            padding: isMobile
              ? '14px 16px'
              : '12px 32px',
            borderTop: '1px solid #111',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'MEN', cat: 'men' },
            { label: 'WOMEN', cat: 'women' },
            { label: 'HOODIES', cat: 'hoodie' },
            { label: 'SHOES', cat: 'shoes' },
            { label: 'SUPPORT', to: '/support' },
            { label: 'PRIVACY', to: settings.policyLinks?.privacy || '/privacy-policy' },
            { label: 'TERMS', to: settings.policyLinks?.terms || '/terms-and-conditions' },
          ].map((l) => (
            <Link
              key={l.cat || l.label}
              to={l.to || `/shop/${l.cat}`}
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 9,
                color: '#888',
                letterSpacing: 2,
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 16px',
            borderTop: '1px solid #111',
          }}
        >
          <span
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 8,
              color: '#444',
            }}
          >
            © 2025 {settings.storeName || 'HOODIE'}. ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </main>
  );
}

const s = {
  scrollArrow: {
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: 'translateY(-50%)',
    zIndex: 10,
    background: '#f5f3ef',
    border: '1px solid #d0cdc9',
    width: 40,
    height: 40,
    fontSize: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaBtn: {
    display: 'inline-block',
    fontFamily: 'Space Mono, monospace',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    padding: '12px 24px',
    border: '1px solid #0a0a0a',
    color: '#0a0a0a',
    textDecoration: 'none',
  },
};
