import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

export default function CartPage() {
  const { cart, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const shipping = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shipping;

  if (!cart.items?.length) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 56, opacity: .15 }}>🛍️</span>
        <h2 style={s.emptyTitle}>YOUR CART IS EMPTY</h2>
        <p style={s.emptySub}>Add some items to get started.</p>
        <Link to="/shop" style={s.primaryBtn}>SHOP NOW</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 28px' }}>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px,10vw,96px)', lineHeight: .9, marginBottom: 28 }}>CART</h1>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? 24 : 40, alignItems: 'start' }}>
          {/* Items */}
          <div>
            {cart.items.map(item => (
              <div key={item._id} style={s.itemRow}>
                {/* Image */}
                <div style={s.itemImg}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 28, opacity: .2 }}>👕</span>}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.itemName}>{item.name}</p>
                  <p style={s.itemMeta}>{item.size} / {item.color}</p>
                  <p style={s.itemPrice}>{fmt(item.price)}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => item.quantity === 1 ? removeItem(item._id) : updateQuantity(item._id, item.quantity - 1)}>−</button>
                      <span style={s.qtyVal}>{item.quantity}</span>
                      <button style={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <span style={s.lineTotal}>{fmt(item.price * item.quantity)}</span>
                  </div>
                  <button onClick={() => removeItem(item._id)} style={s.removeBtn}>Remove</button>
                </div>
              </div>
            ))}
            <Link to="/shop" style={s.continueLnk}>← Continue Shopping</Link>
          </div>

          {/* Summary */}
         <div style={s.summary}>
  <h3 style={s.summaryTitle}>ORDER SUMMARY</h3>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 12,
    }}
  >
    {[
      ['Subtotal', fmt(subtotal)],
      ['Shipping', shipping === 0 ? 'FREE' : fmt(shipping)],
    ].map(([l, v]) => (
      <div
        key={l}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: '#888',
        }}
      >
        <span>{l}</span>

        <span
          style={{
            color: v === 'FREE' ? '#2a7a2a' : undefined,
          }}
        >
          {v}
        </span>
      </div>
    ))}
  </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d0cdc9', paddingTop: 12, marginBottom: 14 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 26 }}>{fmt(total)}</span>
            </div>
            {subtotal < 5000 && (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#2a7a2a', background: 'rgba(42,122,42,.08)', border: '1px solid rgba(42,122,42,.2)', padding: '8px 10px', marginBottom: 14 }}>
                ✦ Add {fmt(5000 - subtotal)} more for free shipping
              </div>
            )}
            <button onClick={() => navigate('/checkout')} style={{ ...s.primaryBtn, display: 'block', width: '100%', border: 'none', cursor: 'pointer', marginBottom: 8 }}>
              CHECKOUT →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  empty: { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyTitle: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,6vw,48px)' },
  emptySub: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  primaryBtn: { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: '14px 24px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', textDecoration: 'none', textAlign: 'center', display: 'inline-block' },
  itemRow: { display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid #ede9e3', alignItems: 'flex-start' },
  itemImg: { width: 80, height: 80, background: '#ede9e3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemName: { fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 },
  itemMeta: { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 3 },
  itemPrice: { fontFamily: 'Space Mono, monospace', fontSize: 11 },
  qtyCtrl: { display: 'flex', alignItems: 'center', border: '1px solid #d0cdc9' },
  qtyBtn: { background: 'none', border: 'none', width: 30, height: 30, fontSize: 14, cursor: 'pointer' },
  qtyVal: { fontFamily: 'Space Mono, monospace', fontSize: 11, width: 32, textAlign: 'center', borderLeft: '1px solid #d0cdc9', borderRight: '1px solid #d0cdc9', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lineTotal: { fontFamily: 'Space Mono, monospace', fontSize: 12 },
  removeBtn: { background: 'none', border: 'none', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#e03030', cursor: 'pointer', padding: '6px 0', textDecoration: 'underline' },
  continueLnk: { display: 'inline-block', marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', textDecoration: 'none', borderBottom: '1px solid #d0cdc9' },
  summary: { background: '#ede9e3', padding: '20px 18px', position: 'sticky', top: 80 },
  summaryTitle: { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, marginBottom: 16, borderBottom: '1px solid #d0cdc9', paddingBottom: 12 },
};
