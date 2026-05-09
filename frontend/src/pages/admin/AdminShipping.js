import React, { useEffect, useState } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';

const fmt  = (n) => `KSh ${Number(n).toLocaleString()}`;
const empty = { name: '', regions: '', price: '', freeOver: '', minDays: 1, maxDays: 5, isActive: true, sortOrder: 0 };

export default function AdminShipping() {
  const [zones,    setZones]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(empty);
  const [editing,  setEditing]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/shipping/admin');
    setZones(res.data.zones);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleEdit = (zone) => {
    setForm({
      name:      zone.name,
      regions:   zone.regions?.join(', ') || '',
      price:     zone.price,
      freeOver:  zone.freeOver ?? '',
      minDays:   zone.minDays,
      maxDays:   zone.maxDays,
      isActive:  zone.isActive,
      sortOrder: zone.sortOrder,
    });
    setEditing(zone._id);
    setShowForm(true);
  };

  const handleCancel = () => { setForm(empty); setEditing(null); setShowForm(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    const payload = {
      ...form,
      price:     Number(form.price),
      freeOver:  form.freeOver !== '' ? Number(form.freeOver) : null,
      minDays:   Number(form.minDays),
      maxDays:   Number(form.maxDays),
      sortOrder: Number(form.sortOrder),
      regions:   form.regions.split(',').map(r => r.trim()).filter(Boolean),
    };
    try {
      if (editing) await api.put(`/shipping/admin/${editing}`, payload);
      else         await api.post('/shipping/admin', payload);
      handleCancel();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipping zone?')) return;
    await api.delete(`/shipping/admin/${id}`);
    load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>SHIPPING ZONES</h1>
          <p style={s.sub}>Set delivery prices by region</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin" style={s.secBtn}>← DASHBOARD</Link>
          {!showForm && <button style={s.btn} onClick={() => setShowForm(true)}>+ ADD ZONE</button>}
        </div>
      </div>

      {!loading && zones.length === 0 && !showForm && (
        <div style={{ padding: '20px 0', fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', lineHeight: 1.9 }}>
          <p>No shipping zones yet. The checkout will use the default flat rate (free over KSh 5,000, otherwise KSh 500).</p>
          <p>Adding zones here lets you charge different rates for e.g. Nairobi CBD vs upcountry vs international.</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={s.formCard}>
          <h3 style={s.cardTitle}>{editing ? 'EDIT ZONE' : 'NEW SHIPPING ZONE'}</h3>
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.grid2}>
            <Field label="ZONE NAME (e.g. Nairobi CBD)" value={form.name} onChange={set('name')} required />
            <Field label="DELIVERY PRICE (KSh, 0 = free)" type="number" value={form.price} onChange={set('price')} required min="0" />
          </div>
          <Field label="REGIONS (comma-separated, shown to customer — e.g. Westlands, Kilimani, CBD)" value={form.regions} onChange={set('regions')} />
          <div style={s.grid2}>
            <Field label="FREE SHIPPING OVER (KSh, blank uses store default 5,000)" type="number" value={form.freeOver} onChange={set('freeOver')} min="0" />
            <div style={s.grid2}>
              <Field label="MIN DAYS" type="number" value={form.minDays} onChange={set('minDays')} min="0" required />
              <Field label="MAX DAYS" type="number" value={form.maxDays} onChange={set('maxDays')} min="0" required />
            </div>
          </div>
          <div style={s.grid2}>
            <Field label="SORT ORDER (lower = shown first)" type="number" value={form.sortOrder} onChange={set('sortOrder')} />
            <Toggle label="Zone active (visible in checkout)" checked={form.isActive} onChange={set('isActive')} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={s.btn} disabled={saving}>{saving ? 'SAVING...' : editing ? 'SAVE CHANGES' : 'CREATE ZONE'}</button>
            <button type="button" style={s.secBtn} onClick={handleCancel}>CANCEL</button>
          </div>
        </form>
      )}

      {/* Zones list */}
      {!loading && zones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#d0cdc9' }}>
          {zones.map(zone => (
            <div key={zone._id} style={{ background: '#f5f3ef', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, opacity: zone.isActive ? 1 : .55 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{zone.name}</strong>
                  {!zone.isActive && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#e03030', border: '1px solid #e03030', padding: '1px 5px' }}>INACTIVE</span>}
                </div>
                {zone.regions?.length > 0 && (
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>{zone.regions.join(' · ')}</p>
                )}
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 3 }}>
                  {zone.minDays}–{zone.maxDays} days
                  {zone.freeOver && ` · Free over ${fmt(zone.freeOver)}`}
                </p>
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, flexShrink: 0 }}>
                {zone.price === 0 ? 'FREE' : fmt(zone.price)}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => handleEdit(zone)} style={s.actionBtn}>Edit</button>
                <button onClick={() => handleDelete(zone._id)} style={{ ...s.actionBtn, color: '#e03030' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required, min }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} min={min} style={s.input} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer', paddingTop: 24 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#0a0a0a' }} /> {label}
    </label>
  );
}

const s = {
  page:     { maxWidth: 900, margin: '0 auto', padding: '32px 28px' },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 12, flexWrap: 'wrap' },
  h1:       { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,5vw,56px)', lineHeight: .9, marginBottom: 4 },
  sub:      { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  btn:      { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' },
  secBtn:   { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  formCard: { border: '1px solid #d0cdc9', padding: 22, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 14 },
  cardTitle:{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  label:    { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:    { width: '100%', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  actionBtn:{ background: 'none', border: 'none', fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer', color: '#888', textDecoration: 'underline' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '8px 12px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)' },
};
