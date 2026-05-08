import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';
import { useCart } from '../context/CartContext';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

const STATUS_META = {
  pending:    { color: '#e07000', bg: 'rgba(224,112,0,.1)'  },
  confirmed:  { color: '#1a5fa8', bg: 'rgba(26,95,168,.1)'  },
  processing: { color: '#6a2a8a', bg: 'rgba(106,42,138,.1)' },
  shipped:    { color: '#2a5fa8', bg: 'rgba(42,95,168,.1)'  },
  delivered:  { color: '#2a7a2a', bg: 'rgba(42,122,42,.1)'  },
  cancelled:  { color: '#e03030', bg: 'rgba(224,48,48,.1)'  },
  refunded:   { color: '#888',    bg: 'rgba(136,136,136,.1)'},
};

export default function OrdersPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({});
  const [busy,       setBusy]       = useState('');
  const { fetchCart } = useCart();

  useEffect(() => {
    setLoading(true);
    api.get('/orders', { params: { page, limit: 10 } })
      .then(r => { setOrders(r.data.orders); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="page-loading">Loading orders...</div>;

  const reorder = async (order) => {
    setBusy(order._id);
    try {
      await api.post(`/orders/${order._id}/reorder`);
      await fetchCart();
    } finally {
      setBusy('');
    }
  };

  const requestCancel = async (order) => {
    const reason = window.prompt('Reason for cancellation?');
    if (reason === null) return;
    setBusy(order._id);
    try {
      const res = await api.post(`/orders/${order._id}/cancel-request`, { reason });
      setOrders(prev => prev.map(o => o._id === order._id ? res.data.order : o));
    } finally {
      setBusy('');
    }
  };

  return (
    <div style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px,8vw,80px)', lineHeight: .9, marginBottom: 6 }}>MY ORDERS</h1>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>{pagination.total || 0} orders</p>
          </div>
          <Link to="/account" style={s.secBtn}>← ACCOUNT</Link>
        </div>

        {!orders.length ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span style={{ fontSize: 48, opacity: .15, display: 'block', marginBottom: 16 }}>📦</span>
            <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, marginBottom: 8 }}>NO ORDERS YET</p>
            <Link to="/shop" style={s.primaryBtn}>START SHOPPING</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#d0cdc9' }}>
            {orders.map(order => {
              const meta   = STATUS_META[order.status] || STATUS_META.pending;
              const isOpen = expanded === order._id;
              return (
                <div key={order._id} style={{ background: '#f5f3ef' }}>
                  {/* Row */}
                  <div onClick={() => setExpanded(isOpen ? null : order._id)}
                    style={{ padding: isMobile ? '14px 14px' : '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 4 : 20, minWidth: 0 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 11 : 12, fontWeight: 700 }}>#{order.orderNumber}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 11 : 12 }}>{fmt(order.total)}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1, padding: '3px 8px', color: meta.color, background: meta.bg, whiteSpace: 'nowrap' }}>
                        {order.status?.toUpperCase()}
                      </span>
                      <span style={{ color: '#888', fontSize: 11, transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform .2s' }}>▼</span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ padding: isMobile ? '16px 14px' : '20px', borderTop: '1px solid #d0cdc9', background: '#faf9f7' }}>
                      {/* Items */}
                      <p style={s.detailLabel}>ITEMS</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 44, height: 44, background: '#ede9e3', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ opacity: .2 }}>👕</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{item.size} / {item.color} ×{item.quantity}</p>
                            </div>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing + address in a grid on desktop */}
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                        <div>
                          <p style={s.detailLabel}>PRICING</p>
                          {[['Subtotal', fmt(order.subtotal)], ['Shipping', order.shipping === 0 ? 'FREE' : fmt(order.shipping)], ...(order.discount ? [['Discount', `-${fmt(order.discount)}`]] : [])].map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 5 }}>
                              <span>{l}</span><span style={{ color: v === 'FREE' ? '#2a7a2a' : undefined }}>{v}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, borderTop: '1px solid #d0cdc9', paddingTop: 7, marginTop: 4 }}>
                            <span>TOTAL</span>
                            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{fmt(order.total)}</span>
                          </div>
                        </div>
                        <div>
                          <p style={s.detailLabel}>DELIVERED TO</p>
                          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#888', lineHeight: 1.8 }}>
                            <strong style={{ color: '#0a0a0a' }}>{order.shippingAddress?.fullName}</strong><br />
                            {order.shippingAddress?.line1}<br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                            {order.shippingAddress?.phone}
                          </p>
                          {order.trackingNumber && (
                            <div style={{ marginTop: 12, padding: '8px 10px', border: '1px solid #d0cdc9', fontFamily: 'Space Mono, monospace', fontSize: 9 }}>
                              📦 {order.trackingCarrier} · <strong>{order.trackingNumber}</strong>
                            </div>
                          )}
                          <Timeline order={order} />
                        </div>
                      </div>

                      {order.cancellationRequested && (
                        <div style={{ marginTop: 14, padding: '8px 10px', border: '1px solid #e07000', color: '#e07000', fontFamily: 'Space Mono, monospace', fontSize: 9 }}>
                          Cancellation requested
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 14, borderTop: '1px solid #d0cdc9', paddingTop: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => reorder(order)} disabled={busy === order._id} style={s.secBtn}>REORDER</button>
                          {['pending', 'confirmed', 'processing'].includes(order.status) && !order.cancellationRequested && (
                            <button type="button" onClick={() => requestCancel(order)} disabled={busy === order._id} style={{ ...s.secBtn, color: '#e03030' }}>CANCEL REQUEST</button>
                          )}
                        </div>
                        <Link to={`/order-confirmed/${order._id}`} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', borderBottom: '1px solid #d0cdc9' }}>
                          View full order →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '28px 0', flexWrap: 'wrap' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '7px 14px', background: page === p ? '#0a0a0a' : 'transparent', color: page === p ? '#f5f3ef' : '#0a0a0a', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ order }) {
  const events = [
    ['Created', order.createdAt],
    ['Confirmed', order.confirmedAt],
    ['Shipped', order.shippedAt],
    ['Delivered', order.deliveredAt],
    ['Cancel requested', order.cancellationRequestedAt],
  ].filter(([, date]) => date);

  if (!events.length) return null;
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #d0cdc9', paddingTop: 10 }}>
      <p style={s.detailLabel}>TIMELINE</p>
      {events.map(([label, date]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 5 }}>
          <span>{label}</span>
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  secBtn:     { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '9px 16px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
  primaryBtn: { display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '12px 28px', background: '#0a0a0a', color: '#f5f3ef', textDecoration: 'none', marginTop: 12 },
  detailLabel:{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', marginBottom: 10 },
};
