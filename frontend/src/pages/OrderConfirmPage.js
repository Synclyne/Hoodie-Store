import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;
const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderConfirmPage() {
  const { id } = useParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading order...</div>;
  if (!order) return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 32 }}>ORDER NOT FOUND</h2>
      <Link to="/account/orders" style={s.btn}>MY ORDERS</Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{ background: '#f5f3ef', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '32px 16px' : '60px 28px' }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, background: '#2a7a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: '#fff' }}>✓</div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,8vw,60px)', lineHeight: .9, marginBottom: 8 }}>ORDER CONFIRMED!</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', letterSpacing: 1 }}>
            ORDER <strong style={{ color: '#0a0a0a' }}>#{order.orderNumber}</strong>
          </p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 4 }}>
            {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Status stepper */}
        <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? '18px 14px' : '24px', marginBottom: 16 }}>
          <p style={s.sectionLabel}>ORDER STATUS</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= currentStep ? '#0a0a0a' : '#d0cdc9', color: i <= currentStep ? '#f5f3ef' : '#888', fontSize: 11, fontWeight: 700 }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7, marginTop: 5, color: i <= currentStep ? '#0a0a0a' : '#888', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < currentStep ? '#0a0a0a' : '#d0cdc9', margin: '0 4px', marginBottom: 18, minWidth: 20 }} />
                )}
              </React.Fragment>
            ))}
          </div>
          {order.trackingNumber && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#ede9e3', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>
              📦 {order.trackingCarrier} — <strong>{order.trackingNumber}</strong>
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? '18px 14px' : '24px', marginBottom: 16 }}>
          <p style={s.sectionLabel}>ITEMS ORDERED</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, background: '#ede9e3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ opacity: .2 }}>👕</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{item.size} / {item.color} ×{item.quantity}</p>
                </div>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #d0cdc9', paddingTop: 12, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Subtotal', fmt(order.subtotal)], ['Shipping', order.shipping === 0 ? 'FREE' : fmt(order.shipping)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>
                <span style={{ color: '#888' }}>{l}</span>
                <span style={{ color: v === 'FREE' ? '#2a7a2a' : undefined }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d0cdc9', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22 }}>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? '18px 14px' : '24px', marginBottom: 28 }}>
          <p style={s.sectionLabel}>SHIPPING TO</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#888', lineHeight: 1.9, marginTop: 10 }}>
            <strong style={{ color: '#0a0a0a' }}>{order.shippingAddress.fullName}</strong><br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country} · 📞 {order.shippingAddress.phone}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/account/orders" style={s.secBtn}>VIEW ALL ORDERS</Link>
          <Link to="/shop"           style={s.btn}>CONTINUE SHOPPING</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  sectionLabel: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', textTransform: 'uppercase' },
  btn:    { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '12px 24px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
  secBtn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '12px 24px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
};
