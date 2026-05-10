import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;
const STATUS_COLORS = { pending: '#e07000', confirmed: '#1a5fa8', processing: '#6a2a8a', shipped: '#2a5fa8', delivered: '#2a7a2a', cancelled: '#e03030', refunded: '#888' };
const ALL_STATUSES  = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrders() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [orders,        setOrders]        = useState([]);
  const [pagination,    setPagination]    = useState({});
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search,        setSearch]        = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId,    setUpdatingId]    = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders', {
        params: {
          page,
          limit: 20,
          ...(statusFilter && { status: statusFilter }),
          ...(paymentFilter && { paymentStatus: paymentFilter }),
          ...(search.trim() && { q: search.trim() }),
        },
      });
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [page, statusFilter, paymentFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrder = async (id, updates) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/admin/orders/${id}`, updates);
      setOrders(prev => prev.map(o => o._id === id ? res.data.order : o));
      if (expandedOrder?._id === id) setExpandedOrder(res.data.order);
    } catch (err) { alert(err.response?.data?.error || 'Update failed'); }
    finally { setUpdatingId(null); }
  };

  const activeSummary = useMemo(() => {
    const pieces = [];
    if (statusFilter) pieces.push(statusFilter);
    if (paymentFilter) pieces.push(`${paymentFilter} payment`);
    if (search.trim()) pieces.push(`"${search.trim()}"`);
    return pieces.length ? pieces.join(' / ') : 'all orders';
  }, [statusFilter, paymentFilter, search]);

  const exportCsv = () => {
    const rows = [
      ['Order', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Payment', 'Subtotal', 'Shipping', 'Total'],
      ...orders.map(order => [
        order.orderNumber,
        new Date(order.createdAt).toLocaleString(),
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || order.shippingAddress?.fullName || '',
        order.user?.email || '',
        order.shippingAddress?.phone || '',
        order.status || '',
        order.paymentStatus || '',
        order.subtotal || 0,
        order.shipping || 0,
        order.total || 0,
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printOrder = (order) => {
    const doc = window.open('', '_blank', 'width=800,height=900');
    if (!doc) return;
    const rows = order.items.map(item => `
      <tr>
        <td>${escapeHtml(item.name)}<br><small>${escapeHtml(item.size)} / ${escapeHtml(item.color)} x${item.quantity}</small></td>
        <td>${fmt(item.price * item.quantity)}</td>
      </tr>
    `).join('');
    doc.document.write(`
      <html><head><title>${escapeHtml(order.orderNumber)}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:36px;color:#111}
        h1{font-size:24px;letter-spacing:2px}
        table{width:100%;border-collapse:collapse;margin-top:24px}
        td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}
        .total{font-weight:700;font-size:18px}
        small,.muted{color:#666}
      </style></head><body>
        <h1>HOODIE ORDER ${escapeHtml(order.orderNumber)}</h1>
        <p class="muted">${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Ship to</strong><br>${escapeHtml(order.shippingAddress?.fullName || '')}<br>${escapeHtml(order.shippingAddress?.line1 || '')}<br>${escapeHtml(order.shippingAddress?.city || '')}, ${escapeHtml(order.shippingAddress?.state || '')}<br>${escapeHtml(order.shippingAddress?.phone || '')}</p>
        <table><thead><tr><th>Item</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
        <p>Subtotal: ${fmt(order.subtotal)}</p>
        <p>Shipping: ${order.shipping === 0 ? 'FREE' : fmt(order.shipping)}</p>
        <p class="total">Total: ${fmt(order.total)}</p>
      </body></html>
    `);
    doc.document.close();
    doc.focus();
    doc.print();
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>ORDERS</h1>
          <p style={s.sub}>{pagination.total || 0} orders / {activeSummary}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={exportCsv} disabled={!orders.length} style={s.secBtn}>EXPORT CSV</button>
          <Link to="/admin" style={s.secBtn}>← BACK</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr .7fr', gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={s.input}
          placeholder="Search order, name, phone, address, tracking..."
        />
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} style={s.input}>
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
        </select>
      </div>

      {/* Status filters — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => { setStatusFilter(''); setPage(1); }} style={{ ...s.filterBtn, background: !statusFilter ? '#0a0a0a' : 'transparent', color: !statusFilter ? '#f5f3ef' : '#0a0a0a', borderColor: !statusFilter ? '#0a0a0a' : '#d0cdc9', flexShrink: 0 }}>ALL</button>
        {ALL_STATUSES.map(st => (
          <button key={st} onClick={() => { setStatusFilter(st); setPage(1); }}
            style={{ ...s.filterBtn, background: statusFilter === st ? STATUS_COLORS[st] : 'transparent', color: statusFilter === st ? '#fff' : '#0a0a0a', borderColor: statusFilter === st ? STATUS_COLORS[st] : '#d0cdc9', flexShrink: 0 }}>
            {st.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {orders.map(order => {
            const isExpanded = expandedOrder?._id === order._id;
            return (
              <div key={order._id} style={{ border: '1px solid #d0cdc9', overflow: 'hidden' }}>
                {/* Summary row */}
                <div
                  style={{ padding: isMobile ? '12px 14px' : '14px 18px', cursor: 'pointer', background: isExpanded ? '#ede9e3' : '#f5f3ef', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 11 : 12, fontWeight: 700 }}>#{order.orderNumber}</span>
                      <span style={{ background: STATUS_COLORS[order.status] || '#888', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: 7, padding: '2px 6px' }}>{order.status?.toUpperCase()}</span>
                      <span style={{ border: '1px solid #d0cdc9', color: '#888', fontFamily: 'Space Mono, monospace', fontSize: 7, padding: '1px 6px' }}>{order.paymentStatus?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.user?.firstName} {order.user?.lastName}{!isMobile && ` · ${order.user?.email}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: isMobile ? 11 : 12 }}>{fmt(order.total)}</span>
                    {!isMobile && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{new Date(order.createdAt).toLocaleDateString()}</span>}
                    <span style={{ color: '#888', fontSize: 11, transition: 'transform .2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: isMobile ? '14px' : '18px', borderTop: '1px solid #d0cdc9', background: '#faf9f7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 16 : 20, marginBottom: 16 }}>

                      {/* Items */}
                      <div>
                        <h4 style={s.secTitle}>ITEMS</h4>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, marginBottom: 6 }}>
                            <span style={{ color: '#888', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.name} ×{item.quantity}</span>
                            <span>{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid #d0cdc9', paddingTop: 6, marginTop: 6 }}>
                          {[['Subtotal', fmt(order.subtotal)], ['Shipping', order.shipping === 0 ? 'FREE' : fmt(order.shipping)], ...(order.discount ? [['Discount', `-${fmt(order.discount)}`]] : []), ['Tax', fmt(order.tax)], ['TOTAL', fmt(order.total)]].map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, marginBottom: 4, fontWeight: l === 'TOTAL' ? 700 : 400 }}>
                              <span style={{ color: '#888' }}>{l}</span><span>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <h4 style={s.secTitle}>SHIP TO</h4>
                        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, lineHeight: 1.9, color: '#888' }}>
                          {order.shippingAddress?.fullName}<br />
                          {order.shippingAddress?.line1}<br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                          {order.shippingAddress?.country} · {order.shippingAddress?.phone}
                        </p>
                        {order.deliveryLocation?.mapsUrl && (
                          <a href={order.deliveryLocation.mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#0a0a0a', textDecoration: 'underline' }}>
                            OPEN LOCATION PIN
                            {order.deliveryLocation.source === 'manual' ? ' / MANUAL LINK' : ''}
                            {order.deliveryLocation.accuracy ? ` / ${Math.round(order.deliveryLocation.accuracy)}m` : ''}
                          </a>
                        )}
                        {order.customerNote && (
                          <div style={{ marginTop: 8, padding: 8, background: '#fff8e6', border: '1px solid #f0d060', fontFamily: 'Space Mono, monospace', fontSize: 9 }}>
                            <span style={{ color: '#888' }}>NOTE: </span>{order.customerNote}
                          </div>
                        )}
                        {order.cancellationRequested && (
                          <div style={{ marginTop: 8, padding: 8, background: '#fff8e6', border: '1px solid #e07000', fontFamily: 'Space Mono, monospace', fontSize: 9 }}>
                            <span style={{ color: '#e07000' }}>CANCEL REQUEST: </span>{order.cancellationReason || 'No reason provided'}
                          </div>
                        )}
                        <Timeline order={order} />
                      </div>

                      {/* Controls */}
                      <div>
                        <h4 style={s.secTitle}>UPDATE</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <label style={s.label}>STATUS</label>
                            <select value={order.status} onChange={e => updateOrder(order._id, { status: e.target.value })} disabled={updatingId === order._id} style={s.input}>
                              {ALL_STATUSES.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
                            </select>
                          </div>
                          <TrackingForm order={order} onUpdate={updates => updateOrder(order._id, updates)} saving={updatingId === order._id} />
                          <button type="button" onClick={() => printOrder(order)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '7px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', cursor: 'pointer' }}>
                            PRINT INVOICE
                          </button>
                          <div>
                            <label style={s.label}>ADMIN NOTE</label>
                            <AdminNoteForm order={order} onUpdate={note => updateOrder(order._id, { adminNote: note })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '24px 0', flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '6px 12px', background: page === p ? '#0a0a0a' : 'transparent', color: page === p ? '#f5f3ef' : '#0a0a0a', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Timeline({ order }) {
  const events = [
    ['Created', order.createdAt],
    ['Confirmed', order.confirmedAt],
    ['Shipped', order.shippedAt],
    ['Delivered', order.deliveredAt],
    ['Cancelled', order.cancelledAt],
    ['Cancel requested', order.cancellationRequestedAt],
  ].filter(([, date]) => date);

  if (!events.length) return null;
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #d0cdc9', paddingTop: 8 }}>
      <h4 style={s.secTitle}>TIMELINE</h4>
      {events.map(([label, date]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 9, marginBottom: 4 }}>
          <span style={{ color: '#888' }}>{label}</span>
          <span>{new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  );
}

function TrackingForm({ order, onUpdate, saving }) {
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [carrier,  setCarrier]  = useState(order.trackingCarrier || '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>TRACKING</label>
      <input value={tracking} onChange={e => setTracking(e.target.value)} style={s.input} placeholder="Tracking number" />
      <input value={carrier}  onChange={e => setCarrier(e.target.value)}  style={s.input} placeholder="Carrier (e.g. DHL)" />
      <button type="button" disabled={saving} onClick={() => onUpdate({ trackingNumber: tracking, trackingCarrier: carrier })}
        style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '7px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' }}>
        {saving ? '...' : 'SAVE TRACKING'}
      </button>
    </div>
  );
}

function AdminNoteForm({ order, onUpdate }) {
  const [note, setNote] = useState(order.adminNote || '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ ...s.input, resize: 'vertical' }} placeholder="Internal note..." />
      <button type="button" onClick={() => onUpdate(note)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '7px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' }}>SAVE NOTE</button>
    </div>
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  h1:        { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 4 },
  sub:       { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  secBtn:    { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 14px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  filterBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '5px 10px', border: '1px solid', cursor: 'pointer' },
  secTitle:  { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', marginBottom: 8 },
  label:     { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 4 },
  input:     { width: '100%', border: '1px solid #d0cdc9', padding: '8px 10px', fontFamily: 'Space Mono, monospace', fontSize: 10, background: 'transparent', outline: 'none' },
};
