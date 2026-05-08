import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const fmt   = (n) => `KSh ${Number(n).toLocaleString()}`;
const empty = { code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', onePerUser: true, expiresAt: '', description: '', isActive: true };

export default function AdminCoupons() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(empty);
  const [editing,  setEditing]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/coupons/admin');
    setCoupons(res.data.coupons);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleEdit = (c) => {
    setForm({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder || '', maxUses: c.maxUses || '', onePerUser: c.onePerUser, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', description: c.description || '', isActive: c.isActive });
    setEditing(c._id); setShowForm(true);
  };

  const handleCancel = () => { setForm(empty); setEditing(null); setShowForm(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    const payload = { ...form, code: form.code.trim().toUpperCase(), value: Number(form.value), minOrder: form.minOrder ? Number(form.minOrder) : 0, maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null };
    try {
      editing ? await api.put(`/coupons/admin/${editing}`, payload) : await api.post('/coupons/admin', payload);
      handleCancel(); load();
    } catch (err) { setError(err.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    await api.delete(`/coupons/admin/${id}`); load();
  };

  const handleToggle = async (c) => {
    await api.put(`/coupons/admin/${c._id}`, { isActive: !c.isActive }); load();
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>COUPONS</h1>
          <p style={s.sub}>{coupons.length} codes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin" style={s.secBtn}>← BACK</Link>
          {!showForm && <button style={s.btn} onClick={() => setShowForm(true)}>+ NEW</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={s.formCard}>
          <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>{editing ? 'EDIT COUPON' : 'NEW COUPON'}</h3>
          {error && <div style={s.error}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <F label="CODE" value={form.code} onChange={set('code')} required disabled={!!editing} />
            <div>
              <label style={s.label}>TYPE</label>
              <select value={form.type} onChange={set('type')} style={s.input}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (KSh)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <F label={form.type === 'percentage' ? 'DISCOUNT %' : 'AMOUNT (KSh)'} type="number" value={form.value} onChange={set('value')} required min="0" />
            <F label="MIN ORDER (KSh, 0 = none)" type="number" value={form.minOrder} onChange={set('minOrder')} min="0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <F label="MAX USES (blank = unlimited)" type="number" value={form.maxUses} onChange={set('maxUses')} min="1" />
            <F label="EXPIRES (blank = never)" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
          <F label="DESCRIPTION (shown to customer)" value={form.description} onChange={set('description')} />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Toggle label="One use per customer" checked={form.onePerUser} onChange={set('onePerUser')} />
            <Toggle label="Active" checked={form.isActive} onChange={set('isActive')} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={s.btn} disabled={saving}>{saving ? 'SAVING...' : editing ? 'SAVE' : 'CREATE'}</button>
            <button type="button" style={s.secBtn} onClick={handleCancel}>CANCEL</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888', padding: 16 }}>Loading...</p> :
       coupons.length === 0 ? <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888', padding: 16 }}>No coupons yet.</p> : (
        isMobile ? (
          /* Mobile: cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#d0cdc9' }}>
            {coupons.map(c => (
              <div key={c._id} style={{ background: '#f5f3ef', padding: '12px 14px', opacity: c.isActive ? 1 : .55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700 }}>{c.code}</p>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 3 }}>
                      {c.type === 'percentage' ? `${c.value}%` : fmt(c.value)} off
                      {c.minOrder ? ` · min ${fmt(c.minOrder)}` : ''}
                      {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString('en-GB')}` : ''}
                    </p>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>Used: {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</p>
                  </div>
                  <button onClick={() => handleToggle(c)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '3px 8px', border: `1px solid ${c.isActive ? '#2a7a2a' : '#e03030'}`, color: c.isActive ? '#2a7a2a' : '#e03030', background: 'transparent', cursor: 'pointer' }}>
                    {c.isActive ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => handleEdit(c)} style={s.actionBtn}>Edit</button>
                  <button onClick={() => handleDelete(c._id)} style={{ ...s.actionBtn, color: '#e03030' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d0cdc9' }}>
                  {['CODE','TYPE','VALUE','MIN ORDER','USES','EXPIRES','STATUS',''].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f0ede9', opacity: c.isActive ? 1 : .55 }}>
                    <td style={s.td}><strong style={{ fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{c.code}</strong></td>
                    <td style={s.td}><span style={s.tag}>{c.type}</span></td>
                    <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{c.type === 'percentage' ? `${c.value}%` : fmt(c.value)}</span></td>
                    <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>{c.minOrder ? fmt(c.minOrder) : '—'}</span></td>
                    <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</span></td>
                    <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : 'Never'}</span></td>
                    <td style={s.td}><button onClick={() => handleToggle(c)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '3px 8px', border: `1px solid ${c.isActive ? '#2a7a2a' : '#e03030'}`, color: c.isActive ? '#2a7a2a' : '#e03030', background: 'transparent', cursor: 'pointer' }}>{c.isActive ? 'ACTIVE' : 'OFF'}</button></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(c)} style={s.actionBtn}>Edit</button>
                        <button onClick={() => handleDelete(c._id)} style={{ ...s.actionBtn, color: '#e03030' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function F({ label, type = 'text', value, onChange, required, min, disabled }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} min={min} disabled={disabled} style={{ ...s.input, opacity: disabled ? .6 : 1 }} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#0a0a0a' }} /> {label}
    </label>
  );
}

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' },
  h1:        { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 4 },
  sub:       { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  btn:       { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' },
  secBtn:    { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 14px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  formCard:  { border: '1px solid #d0cdc9', padding: isMobile => isMobile ? 14 : 22, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  label:     { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:     { width: '100%', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  th:        { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textAlign: 'left', padding: '8px 10px', letterSpacing: 1 },
  td:        { padding: '10px 10px', verticalAlign: 'middle' },
  tag:       { fontFamily: 'Space Mono, monospace', fontSize: 8, padding: '2px 6px', border: '1px solid #d0cdc9', color: '#888' },
  actionBtn: { background: 'none', border: 'none', fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer', color: '#888', textDecoration: 'underline' },
  error:     { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '8px 12px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)' },
};

// Note: formCard padding uses isMobile but inline styles can't be functions — just use fixed padding
s.formCard = { border: '1px solid #d0cdc9', padding: 18, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 };