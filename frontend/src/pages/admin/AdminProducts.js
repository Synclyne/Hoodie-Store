import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

export default function AdminProducts() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [lowStock,   setLowStock]   = useState(false);
  const [deleting,   setDeleting]   = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', { params: { page, limit: 20, ...(search && { search }), ...(lowStock && { lowStock: 10 }) } });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [page, search, lowStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try { await api.delete(`/admin/products/${id}`); fetchProducts(); }
    finally { setDeleting(null); }
  };

  const handleTogglePublish = async (product) => {
    await api.put(`/admin/products/${product._id}`, { isPublished: !product.isPublished });
    fetchProducts();
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>PRODUCTS</h1>
          <p style={s.sub}>{pagination.total || 0} products</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/admin" style={s.secBtn}>← BACK</Link>
          <Link to="/admin/products/new" style={s.btn}>+ ADD</Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          style={{ flex: 1, border: '1px solid #d0cdc9', padding: '9px 12px', fontFamily: 'Space Mono, monospace', fontSize: 10, background: 'transparent', outline: 'none' }} />
        <button onClick={() => { setLowStock(v => !v); setPage(1); }} style={{ ...s.secBtn, background: lowStock ? '#0a0a0a' : 'transparent', color: lowStock ? '#f5f3ef' : '#0a0a0a' }}>LOW STOCK</button>
        {search && <button onClick={() => setSearch('')} style={s.secBtn}>✕</button>}
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <>
          {isMobile ? (
            /* Mobile: card list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#d0cdc9' }}>
              {products.map(p => (
                <div key={p._id} style={{ background: '#f5f3ef', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', opacity: p.isPublished ? 1 : .55 }}>
                  <div style={{ width: 52, height: 52, background: '#ede9e3', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.images?.[0] ? <img src={p.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👕'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>
                      {fmt(p.price)} · stock: <span style={{ color: p.totalStock === 0 ? '#e03030' : p.totalStock < 10 ? '#e07000' : '#2a7a2a' }}>{p.totalStock}</span>
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => navigate(`/admin/products/${p._id}/edit`)} style={s.actionBtn}>EDIT</button>
                      <button onClick={() => handleTogglePublish(p)} style={{ ...s.actionBtn, color: p.isPublished ? '#e07000' : '#2a7a2a', borderColor: p.isPublished ? '#e07000' : '#2a7a2a' }}>
                        {p.isPublished ? 'HIDE' : 'PUBLISH'}
                      </button>
                      <button onClick={() => handleDelete(p._id, p.name)} disabled={deleting === p._id} style={{ ...s.actionBtn, color: '#e03030', borderColor: '#e03030' }}>
                        {deleting === p._id ? '...' : 'DEL'}
                      </button>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '2px 6px', background: p.isPublished ? '#2a7a2a' : '#888', color: '#fff', flexShrink: 0, alignSelf: 'flex-start' }}>
                    {p.isPublished ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: table */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #d0cdc9' }}>
                    {['PRODUCT', 'CATEGORY', 'PRICE', 'STOCK', 'STATUS', 'ACTIONS'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f0ede9', opacity: p.isPublished ? 1 : .5 }}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 44, height: 44, background: '#ede9e3', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.images?.[0] ? <img src={p.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👕'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}><span style={s.pill}>{p.category}</span> <span style={s.pill}>{p.gender}</span></td>
                      <td style={s.td}>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{fmt(p.price)}</div>
                        {p.comparePrice && <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'line-through' }}>{fmt(p.comparePrice)}</div>}
                      </td>
                      <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: p.totalStock === 0 ? '#e03030' : p.totalStock < 10 ? '#e07000' : '#2a7a2a' }}>{p.totalStock}</span></td>
                      <td style={s.td}><span style={{ background: p.isPublished ? '#2a7a2a' : '#888', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '3px 8px' }}>{p.isPublished ? 'LIVE' : 'DRAFT'}</span></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => navigate(`/admin/products/${p._id}/edit`)} style={s.actionBtn}>EDIT</button>
                          <button onClick={() => handleTogglePublish(p)} style={{ ...s.actionBtn, color: p.isPublished ? '#e07000' : '#2a7a2a', borderColor: p.isPublished ? '#e07000' : '#2a7a2a' }}>{p.isPublished ? 'HIDE' : 'PUBLISH'}</button>
                          <button onClick={() => handleDelete(p._id, p.name)} disabled={deleting === p._id} style={{ ...s.actionBtn, color: '#e03030', borderColor: '#e03030' }}>{deleting === p._id ? '...' : 'DELETE'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '24px 0', flexWrap: 'wrap' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '6px 12px', background: page === p ? '#0a0a0a' : 'transparent', color: page === p ? '#f5f3ef' : '#0a0a0a', cursor: 'pointer' }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  h1:        { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 4 },
  sub:       { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  btn:       { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', textDecoration: 'none', cursor: 'pointer' },
  secBtn:    { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 14px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  th:        { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textAlign: 'left', padding: '8px 10px', letterSpacing: 1 },
  td:        { padding: '12px 10px', verticalAlign: 'middle' },
  pill:      { fontFamily: 'Space Mono, monospace', fontSize: 8, background: '#ede9e3', padding: '2px 6px', marginRight: 3 },
  actionBtn: { fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: .5, padding: '4px 8px', background: 'transparent', border: '1px solid #d0cdc9', cursor: 'pointer' },
};
