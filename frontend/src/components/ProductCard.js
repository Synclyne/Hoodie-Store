import React, { useState } from 'react';
import { useNavigate } from '../next/ReactRouterCompat';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;
const BADGE_COLORS = { bestseller: '#e03030', sale: '#e07000', new: '#0a0a0a', limited: '#7a2a7a' };

export default function ProductCard({ product }) {
  const navigate              = useNavigate();
  const { addToCart }         = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const isMobile              = useMediaQuery('(max-width: 768px)');
  const [adding,   setAdding]   = useState(false);
  const [hearted,  setHearted]  = useState(false);
  const [hovered,  setHovered]  = useState(false);

  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];
  const discount     = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : null;
  const wishlisted   = isWishlisted(product._id);
  const showOverlay  = isMobile || hovered;

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    const firstVariant = product.variants?.find(v => v.stock > 0);
    if (!firstVariant) return;
    setAdding(true);
    await addToCart(product._id, firstVariant._id, 1);
    setAdding(false);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    setHearted(true);
    setTimeout(() => setHearted(false), 350);
    await toggle(product._id);
  };

  return (
    <div
      style={s.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/product/${product.slug}`)}
    >
      {/* Image container — all overlays live here */}
      <div style={s.imgWrap}>
        {primaryImage
          ? <img src={primaryImage.url} alt={primaryImage.alt || product.name} style={{ ...s.img, transform: hovered && !isMobile ? 'scale(1.04)' : 'scale(1)' }} />
          : <span style={{ fontSize: 36, opacity: .2 }}>👕</span>
        }

        {/* Badge top-left */}
        {product.badge && (
          <span style={{ ...s.badge, background: BADGE_COLORS[product.badge] || '#0a0a0a' }}>
            {product.badge.toUpperCase()}
          </span>
        )}
        {discount && (
          <span style={{ ...s.badge, left: 'auto', right: 8, background: '#e07000' }}>−{discount}%</span>
        )}

        {/* Bottom overlay: Quick Add + Wishlist — slides up on hover */}
        <div style={{ ...s.overlay, opacity: showOverlay ? 1 : 0, transform: showOverlay ? 'translateY(0)' : 'translateY(6px)', pointerEvents: showOverlay ? 'all' : 'none' }}>
          <button
            onClick={handleQuickAdd}
            disabled={adding || product.totalStock === 0}
            style={{ ...s.quickAddBtn, opacity: product.totalStock === 0 ? .55 : 1 }}
          >
            {product.totalStock === 0 ? 'OUT OF STOCK' : adding ? '...' : 'QUICK ADD'}
          </button>
          <button
            onClick={handleWishlist}
            style={{
              ...s.heartBtn,
              background: wishlisted ? '#0a0a0a' : 'rgba(245,243,239,.92)',
              transform: hearted ? 'scale(1.2)' : 'scale(1)',
            }}
            title={wishlisted ? 'Remove from wishlist' : 'Save'}
          >
            {wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      {/* Info — minimal, no extra rows */}
      <div style={s.info}>
        <p style={s.name}>{product.name}</p>
        <div style={s.priceRow}>
          <span style={{ ...s.price, color: product.comparePrice ? '#e03030' : '#0a0a0a' }}>{fmt(product.price)}</span>
          {product.comparePrice && <span style={s.comparePrice}>{fmt(product.comparePrice)}</span>}
        </div>
      </div>
    </div>
  );
}

const s = {
  card:         { background: '#f5f3ef', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' },
  imgWrap:      { position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#ede9e3', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img:          { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' },
  badge:        { position: 'absolute', top: 8, left: 8, zIndex: 2, fontFamily: 'Space Mono, monospace', fontSize: 7, letterSpacing: 1, padding: '3px 6px', color: '#fff' },
  overlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', display: 'flex', gap: 5, alignItems: 'center', background: 'linear-gradient(to top, rgba(10,10,10,.35) 0%, transparent 100%)', transition: 'opacity .2s, transform .2s', zIndex: 3 },
  quickAddBtn:  { flex: 1, fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1, padding: '7px 6px', background: '#f5f3ef', color: '#0a0a0a', border: 'none', cursor: 'pointer' },
  heartBtn:     { width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(208,205,201,.6)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .18s, background .15s', flexShrink: 0 },
  info:         { padding: '8px 10px 10px' },
  name:         { fontSize: 12, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 },
  priceRow:     { display: 'flex', alignItems: 'center', gap: 6 },
  price:        { fontFamily: 'Space Mono, monospace', fontSize: 10 },
  comparePrice: { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'line-through' },
};