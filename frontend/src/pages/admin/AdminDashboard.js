import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
const STATUS_COLORS = { pending: '#e07000', confirmed: '#2a7a2a', processing: '#1a5fa8', shipped: '#6a2a8a', delivered: '#2a7a2a', cancelled: '#e03030', refunded: '#888' };

function StatCard({ label, value, sub, color = '#0a0a0a' }) {
  return (
    <div style={{ background: '#f5f3ef', border: '1px solid #d0cdc9', padding: '16px 18px' }}>
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', letterSpacing: 2, marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{sub}</p>}
    </div>
  );
}

function BreakdownList({ title, rows, valueKey = 'count', money = false }) {
  return (
    <div style={{ border: '1px solid #d0cdc9', padding: 16 }}>
      <h3 style={s.cardTitle}>{title}</h3>
      {(rows || []).slice(0, 5).map((row) => (
        <div key={row._id || 'unknown'} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, marginTop: 8 }}>
          <span style={{ color: '#888', textTransform: 'uppercase' }}>{row._id || 'unknown'}</span>
          <span>{money ? fmt(row[valueKey]) : row[valueKey]}</span>
        </div>
      ))}
      {!(rows || []).length && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 8 }}>No data yet</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [chart,   setChart]   = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { hasPermission } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/analytics/revenue-chart?months=6'),
    ]).then(([a, c]) => { setData(a.data); setChart(c.data.chart); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  const maxRevenue = Math.max(...chart.map(d => d.revenue), 1);
  const growth     = data.revenue.growth;

  const NAV_LINKS = [
    { to: '/admin/products', label: 'PRODUCTS', permission: 'products' },
    { to: '/admin/media',    label: 'MEDIA', permission: 'products' },
    { to: '/admin/orders',   label: 'ORDERS', permission: 'orders' },
    { to: '/admin/homepage', label: 'HOMEPAGE EDITOR', permission: 'homepage' },
    { to: '/admin/coupons',  label: 'COUPONS', permission: 'coupons' },
    { to: '/admin/shipping', label: 'SHIPPING', permission: 'shipping' },
    { to: '/admin/settings', label: 'SETTINGS', permission: 'settings' },
    { to: '/admin/staff',    label: 'STAFF', permission: 'staff' },
    { to: '/',               label: 'STORE ↗',  ghost: true },
  ].filter(l => !l.permission || hasPermission(l.permission));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 6 }}>DASHBOARD</h1>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Welcome back — here's what's happening.</p>
      </div>

      {/* Nav links — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {NAV_LINKS.map(l => (
          <Link key={l.to} to={l.to} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 14px', background: l.ghost ? 'transparent' : '#0a0a0a', color: l.ghost ? '#0a0a0a' : '#f5f3ef', border: `1px solid ${l.ghost ? '#d0cdc9' : '#0a0a0a'}`, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 1, background: '#d0cdc9', marginBottom: 24 }}>
        <StatCard label="TOTAL REVENUE"  value={fmt(data.revenue.total)}      sub={`${growth >= 0 ? '+' : ''}${growth}% vs last month`} color={growth >= 0 ? '#2a7a2a' : '#e03030'} />
        <StatCard label="THIS MONTH"     value={fmt(data.revenue.thisMonth)}   sub={`${data.orders.thisMonth} orders`} />
        <StatCard label="TOTAL ORDERS"   value={data.orders.total}             sub={`${data.orders.pending} pending / ${data.abandonedCarts || 0} abandoned carts`} />
        <StatCard label="CUSTOMERS"      value={data.customers.total}          sub={`+${data.customers.newThisMonth} this month / ${data.repeatCustomers || 0} repeat`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, marginBottom: 24 }}>
        {/* Revenue chart */}
        <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? 16 : 24 }}>
          <h3 style={s.cardTitle}>REVENUE — LAST 6 MONTHS</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginTop: 16 }}>
            {chart.map(d => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {!isMobile && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7, color: '#888' }}>{fmt(d.revenue).replace('KSh ', '')}</span>}
                <div style={{ width: '100%', background: '#0a0a0a', height: Math.max(4, (d.revenue / maxRevenue) * 90), transition: 'height .4s' }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7, color: '#888', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory + top products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid #d0cdc9', padding: 16 }}>
            <h3 style={s.cardTitle}>INVENTORY</h3>
            <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, marginTop: 6 }}>{data.products.total} <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>products</span></p>
            {data.products.lowStock > 0 && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#e07000', marginTop: 4 }}>⚠ {data.products.lowStock} low stock</p>}
          </div>
          <div style={{ border: '1px solid #d0cdc9', padding: 16, flex: 1 }}>
            <h3 style={s.cardTitle}>TOP PRODUCTS</h3>
            {data.topProducts.slice(0, 3).map((p, i) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, marginTop: 8 }}>
                <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{i + 1}. {p.name}</span>
                <span>{p.totalSold} sold</span>
              </div>
            ))}
          </div>
          <BreakdownList title="CATEGORY SALES" rows={data.categorySales} valueKey="revenue" money />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <BreakdownList title="ORDER STATUS" rows={data.orderStatusBreakdown} />
        <BreakdownList title="PAYMENT STATUS" rows={data.paymentStatusBreakdown} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <BreakdownList title="COUPONS" rows={data.couponPerformance} valueKey="uses" />
        <BreakdownList title="BEST SIZES" rows={data.bestSizes} valueKey="totalSold" />
        <BreakdownList title="BEST COLOURS" rows={data.bestColors} valueKey="totalSold" />
      </div>

      <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? 16 : 24, marginBottom: 24 }}>
        <h3 style={s.cardTitle}>DAILY SALES</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90, marginTop: 16 }}>
          {(data.dailySales || []).map(day => {
            const maxDaily = Math.max(...(data.dailySales || []).map(d => d.revenue), 1);
            return (
              <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: '#0a0a0a', height: Math.max(4, (day.revenue / maxDaily) * 72) }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7, color: '#888' }}>{day._id.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? 14 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={s.cardTitle}>RECENT ORDERS</h3>
          <Link to="/admin/orders" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>View all →</Link>
        </div>

        {isMobile ? (
          /* Mobile: card list instead of table */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.recentOrders.map(order => (
              <Link key={order._id} to="/admin/orders" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, padding: '12px', border: '1px solid #f0ede9', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700 }}>#{order.orderNumber}</p>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>{order.user?.firstName} {order.user?.lastName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{fmt(order.total)}</p>
                  <span style={{ background: STATUS_COLORS[order.status] || '#888', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: 7, padding: '2px 6px', marginTop: 4, display: 'inline-block' }}>{order.status?.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #d0cdc9' }}>
                  {['ORDER', 'CUSTOMER', 'DATE', 'TOTAL', 'STATUS'].map(h => (
                    <th key={h} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textAlign: 'left', padding: '6px 8px', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #f0ede9' }}>
                    <td style={s.td}>#{order.orderNumber}</td>
                    <td style={s.td}>{order.user?.firstName} {order.user?.lastName}</td>
                    <td style={s.td}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={s.td}>{fmt(order.total)}</td>
                    <td style={s.td}><span style={{ background: STATUS_COLORS[order.status] || '#888', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '3px 8px' }}>{order.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  cardTitle: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#888' },
  td:        { fontFamily: 'Space Mono, monospace', fontSize: 10, padding: '10px 8px' },
};
