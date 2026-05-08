import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

export default function WishlistPage() {
  const { items, toggle } = useWishlist();
  const { addToCart }     = useCart();
  const navigate          = useNavigate();
  const isMobile          = useMediaQuery('(max-width: 768px)');

  if (!items.length) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <span style={{ fontSize: 56, opacity: .15 }}>🤍</span>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,6vw,48px)' }}>YOUR WISHLIST IS EMPTY</h2>
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Save items you love and come back to them later.</p>
      <Link to="/shop" style={s.btn}>SHOP NOW</Link>
    </div>
  );

  return (
    <div style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 28px' }}>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px,8vw,80px)', lineHeight: .9, marginBottom: 8 }}>WISHLIST</h1>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 28 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 1, background: '#d0cdc9' }}>
          {items.map(product => {
            const img      = product.images?.find(i => i.isPrimary) || product.images?.[0];
            const firstVar = product.variants?.find(v => v.stock > 0);
            const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : null;

            return (
              <div key={product._id} style={{ background: '#f5f3ef', position: 'relative' }}>
                {/* Remove button */}
                <button onClick={() => toggle(product._id)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: 'rgba(245,243,239,.9)', border: '1px solid #d0cdc9', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove from wishlist">✕</button>

                {/* Image */}
                <div onClick={() => navigate(`/product/${product.slug}`)} style={{ aspectRatio: '1', overflow: 'hidden', background: '#ede9e3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {img ? <img src={img.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48, opacity: .2 }}>👕</span>}
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: product.comparePrice ? '#e03030' : '#0a0a0a' }}>{fmt(product.price)}</span>
                    {product.comparePrice && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', textDecoration: 'line-through' }}>{fmt(product.comparePrice)}</span>}
                    {discount && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, background: '#e03030', color: '#fff', padding: '2px 5px' }}>−{discount}%</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/product/${product.slug}`)}
                      style={{ flex: 1, fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px', border: '1px solid #0a0a0a', background: '#0a0a0a', color: '#f5f3ef', cursor: 'pointer' }}
                    >
                      {product.totalStock === 0 ? 'OUT OF STOCK' : 'VIEW ITEM'}
                    </button>
                    {firstVar && product.totalStock > 0 && (
                      <button
                        onClick={() => addToCart(product._id, firstVar._id, 1)}
                        style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '9px 12px', border: '1px solid #0a0a0a', background: 'transparent', cursor: 'pointer' }}
                        title="Quick add to cart"
                      >
                        🛍️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: '12px 28px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', textDecoration: 'none', display: 'inline-block' },
};