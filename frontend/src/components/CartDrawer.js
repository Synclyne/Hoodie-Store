import React from 'react';
import { Link, useNavigate } from '../next/ReactRouterCompat';
import { useCart } from '../context/CartContext';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeItem, subtotal } = useCart();
  const navigate  = useNavigate();
  const isMobile  = useMediaQuery('(max-width: 768px)');

  const total     = subtotal;
  const itemCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  // On mobile: slide up from bottom. On desktop: slide in from right.
  const drawerStyle = isMobile
    ? { ...s.drawer, width: '100%', maxWidth: '100%', top: 'auto', bottom: 0, right: 0, left: 0, transform: cartOpen ? 'translateY(0)' : 'translateY(100%)', maxHeight: '90vh', borderRadius: '12px 12px 0 0' }
    : { ...s.drawer, transform: cartOpen ? 'translateX(0)' : 'translateX(100%)' };

  return (
    <>
      <div style={{ ...s.overlay, opacity: cartOpen ? 1 : 0, pointerEvents: cartOpen ? 'all' : 'none' }} onClick={() => setCartOpen(false)} />

      <div style={drawerStyle}>
        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>CART ({itemCount})</h2>
          <button style={s.closeBtn} onClick={() => setCartOpen(false)} aria-label="Close">✕</button>
        </div>

        {/* Items */}
        <div style={s.items}>
          {!cart.items?.length ? (
            <div style={s.empty}>
              <span style={{ fontSize: 44, opacity: .2 }}>🛍️</span>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' }}>Your cart is empty</p>
              <button style={s.shopBtn} onClick={() => { setCartOpen(false); navigate('/shop'); }}>SHOP NOW</button>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item._id} style={s.item}>
                {/* Image */}
                <div style={s.itemImg}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, opacity: .2 }}>👕</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.itemName}>{item.name}</p>
                  <p style={s.itemMeta}>{item.size} / {item.color}</p>
                  <p style={s.itemMeta}>{fmt(item.price)}</p>
                  <div style={s.qtyRow}>
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => item.quantity === 1 ? removeItem(item._id) : updateQuantity(item._id, item.quantity - 1)}>−</button>
                      <span style={s.qtyVal}>{item.quantity}</span>
                      <button style={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <span style={s.lineTotal}>{fmt(item.price * item.quantity)}</span>
                  </div>
                </div>

                {/* Remove */}
                <button style={s.removeBtn} onClick={() => removeItem(item._id)}>✕</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items?.length > 0 && (
          <div style={s.footer}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {[['Subtotal', fmt(subtotal)], ['Shipping', 'Selected at checkout']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>
                  <span style={{ color: '#888' }}>{l}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d0cdc9', paddingTop: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700 }}>ITEM TOTAL</span>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 24 }}>{fmt(total)}</span>
            </div>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#2a7a2a', background: 'rgba(42,122,42,.08)', border: '1px solid rgba(42,122,42,.2)', padding: '7px 10px', marginBottom: 12, lineHeight: 1.6 }}>
              Free shipping threshold: {fmt(5000)}. Final shipping is based on your delivery zone.
            </p>
            {subtotal < 5000 && (
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#2a7a2a', background: 'rgba(42,122,42,.08)', border: '1px solid rgba(42,122,42,.2)', padding: '7px 10px', marginBottom: 12 }}>
                ✦ Add {fmt(5000 - subtotal)} more for free shipping
              </p>
            )}
            <Link to="/checkout" style={s.checkoutBtn} onClick={() => setCartOpen(false)}>
              CHECKOUT →
            </Link>
            <button style={s.continueBtn} onClick={() => setCartOpen(false)}>CONTINUE SHOPPING</button>
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, transition: 'opacity .3s' },
  drawer:      { position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#f5f3ef', zIndex: 501, transition: 'transform .3s', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,.1)' },
  header:      { padding: '18px 20px', borderBottom: '1px solid #d0cdc9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title:       { fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: 2 },
  closeBtn:    { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 },
  items:       { flex: 1, overflowY: 'auto', padding: '12px 20px' },
  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, paddingTop: 40 },
  shopBtn:     { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px 22px', border: '1px solid #0a0a0a', background: 'transparent', cursor: 'pointer' },
  item:        { display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #ede9e3', alignItems: 'flex-start' },
  itemImg:     { width: 72, height: 72, background: '#ede9e3', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemName:    { fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 },
  itemMeta:    { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 3 },
  qtyRow:      { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyCtrl:     { display: 'flex', alignItems: 'center', border: '1px solid #d0cdc9' },
  qtyBtn:      { background: 'none', border: 'none', width: 26, height: 26, fontSize: 14, cursor: 'pointer' },
  qtyVal:      { fontFamily: 'Space Mono, monospace', fontSize: 10, width: 28, textAlign: 'center', borderLeft: '1px solid #d0cdc9', borderRight: '1px solid #d0cdc9', height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lineTotal:   { fontFamily: 'Space Mono, monospace', fontSize: 11 },
  removeBtn:   { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 2 },
  footer:      { padding: '14px 20px', borderTop: '1px solid #d0cdc9', flexShrink: 0 },
  checkoutBtn: { display: 'block', width: '100%', fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: 14, background: '#0a0a0a', color: '#f5f3ef', border: 'none', textAlign: 'center', marginBottom: 8, textDecoration: 'none', cursor: 'pointer' },
  continueBtn: { width: '100%', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: 12, background: 'transparent', color: '#0a0a0a', border: '1px solid #0a0a0a', cursor: 'pointer' },
};
