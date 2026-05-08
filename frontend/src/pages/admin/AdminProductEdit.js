import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';
import MediaPicker from '../../components/admin/MediaPicker';

const CATEGORIES    = ['hoodie', 'sweatshirt', 'outwear', 'athletic', 'shoes', 'accessories'];
const GENDERS       = ['men', 'women', 'unisex', 'kids'];
const BADGES        = ['', 'bestseller', 'new', 'sale', 'limited'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES    = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const emptyProduct = {
  name: '', slug: '', description: '', details: '',
  price: '', comparePrice: '', category: 'hoodie',
  gender: 'unisex', badge: '', isFeatured: false,
  isPublished: true, images: [], variants: [],
};

export default function AdminProductEdit() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isMobile   = useMediaQuery('(max-width: 768px)');
  const isNew      = !id;

  const [form,       setForm]       = useState(emptyProduct);
  const [variants,   setVariants]   = useState([]);
  const [newVariant, setNewVariant] = useState({ size: 'M', color: '', colorHex: '#000000', stock: 0, sku: '' });
  const [imageUrl,   setImageUrl]   = useState('');
  const [loading,    setLoading]    = useState(!isNew);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [mediaOpen,  setMediaOpen]  = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/products/${id}`)
        .then(r => { setForm(r.data.product); setVariants(r.data.product.variants || []); })
        .catch(() => navigate('/admin/products'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, navigate]);

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (k === 'name' && isNew) {
      setForm(f => ({ ...f, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
    }
    if (k === 'category') {
      setNewVariant(v => ({ ...v, size: val === 'shoes' ? '40' : 'M' }));
    }
  };

  const addVariant = () => {
    if (!newVariant.color) { setError('Colour is required.'); return; }
    const { _id: _ignored, ...variantData } = newVariant;
    setVariants(v => [...v, { ...variantData, stock: Number(newVariant.stock) }]);
    setNewVariant({ size: form.category === 'shoes' ? '40' : 'M', color: '', colorHex: '#000000', stock: 0, sku: '' });
    setError('');
  };

  const removeVariant      = (idx)        => setVariants(v => v.filter((_, i) => i !== idx));
  const updateVariantStock = (idx, stock) => setVariants(v => v.map((vr, i) => i === idx ? { ...vr, stock: Number(stock) } : vr));

  const addImage    = ()    => {
    if (!imageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, { url: imageUrl.trim(), alt: form.name, isPrimary: f.images.length === 0 }] }));
    setImageUrl('');
  };
  const addImageFromMedia = (url) => {
    setForm(f => ({ ...f, images: [...f.images, { url, alt: form.name, isPrimary: f.images.length === 0 }] }));
  };
  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  const setPrimary  = (idx) => setForm(f => ({ ...f, images: f.images.map((img, i) => ({ ...img, isPrimary: i === idx })) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    const payload = { ...form, variants, price: Number(form.price), comparePrice: form.comparePrice ? Number(form.comparePrice) : null };
    try {
      if (isNew) {
        const res = await api.post('/admin/products', payload);
        setSuccess('Product created!');
        setTimeout(() => navigate(`/admin/products/${res.data.product._id}/edit`), 1000);
      } else {
        await api.put(`/admin/products/${id}`, payload);
        setSuccess('✓ Saved!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  const SaveBtn = () => (
    <button type="submit" disabled={saving} style={{ ...s.btn, width: '100%', padding: 16, fontSize: 12 }}>
      {saving ? 'SAVING...' : isNew ? 'CREATE PRODUCT' : 'SAVE CHANGES'}
    </button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 16 : 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,6vw,56px)', lineHeight: .9, marginBottom: 4 }}>
            {isNew ? 'NEW PRODUCT' : 'EDIT PRODUCT'}
          </h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>{isNew ? 'Create a new product' : form.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <Link to="/admin/products" style={{ ...s.secBtn, flex: isMobile ? 1 : 'unset', textAlign: 'center' }}>← PRODUCTS</Link>
          {!isNew && <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" style={{ ...s.secBtn, flex: isMobile ? 1 : 'unset', textAlign: 'center' }}>VIEW →</a>}
        </div>
      </div>

      {error   && <div style={s.errorBox}>{error}</div>}
      {success && <div style={s.successBox}>{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Two-column on desktop, single column on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? 16 : 28, alignItems: 'start' }}>

          {/* ── MAIN COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

            {/* Settings panel shown at top on mobile */}
            {isMobile && <SettingsPanel form={form} set={set} isMobile={isMobile} />}

            {/* Basic info */}
            <Section title="BASIC INFO">
              <Field label="PRODUCT NAME" value={form.name}        onChange={set('name')} required />
              <Field label="SLUG (URL)"   value={form.slug}        onChange={set('slug')} required />
              <div>
                <label style={s.label}>DESCRIPTION</label>
                <textarea value={form.description} onChange={set('description')} rows={4} style={{ ...s.input, resize: 'vertical' }} required />
              </div>
              <div>
                <label style={s.label}>DETAILS & FIT</label>
                <textarea value={form.details} onChange={set('details')} rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </div>
            </Section>

            {/* Pricing */}
            <Section title="PRICING">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <Field label="PRICE (KSh)"         type="number" value={form.price}               onChange={set('price')}       required min="0" />
                <Field label="COMPARE PRICE (KSh)" type="number" value={form.comparePrice || ''}  onChange={set('comparePrice')}         min="0" />
              </div>
            </Section>

            {/* Variants */}
            <Section title={`VARIANTS (${variants.length})`}>
              {/* Mobile: cards; Desktop: table */}
              {variants.length > 0 && (
                isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {variants.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #d0cdc9' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: v.colorHex || '#000', border: '1px solid #d0cdc9', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{v.size} · {v.color}</p>
                          {v.sku && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#888' }}>{v.sku}</p>}
                        </div>
                        <input type="number" value={v.stock} min="0" aria-label="Stock" onChange={e => updateVariantStock(i, e.target.value)}
                          style={{ width: 64, border: '1px solid #d0cdc9', padding: '7px 8px', fontFamily: 'Space Mono, monospace', fontSize: 11, background: 'transparent', textAlign: 'center', boxSizing: 'border-box' }} />
                        <span style={{ display: 'none' }}>in stock</span>
                        <button type="button" onClick={() => removeVariant(i)} style={{ background: 'none', border: 'none', color: '#e03030', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #d0cdc9' }}>
                        {['SIZE', 'COLOUR', 'STOCK', 'SKU', ''].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0ede9' }}>
                          <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{v.size}</span></td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', background: v.colorHex || '#000', border: '1px solid #d0cdc9' }} />
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{v.color}</span>
                            </div>
                          </td>
                          <td style={s.td}>
                            <input type="number" value={v.stock} min="0" onChange={e => updateVariantStock(i, e.target.value)}
                              style={{ width: 60, border: '1px solid #d0cdc9', padding: '4px 6px', fontFamily: 'Space Mono, monospace', fontSize: 10, background: 'transparent' }} />
                          </td>
                          <td style={s.td}><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{v.sku}</span></td>
                          <td style={s.td}><button type="button" onClick={() => removeVariant(i)} style={{ background: 'none', border: 'none', color: '#e03030', cursor: 'pointer', fontSize: 14 }}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* Add variant form */}
              <div style={{ background: '#ede9e3', padding: 14 }}>
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, color: '#888', marginBottom: 10 }}>ADD VARIANT</p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto auto auto auto auto auto', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <label style={s.label}>SIZE</label>
                    <select value={newVariant.size} onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))} style={{ ...s.input, width: isMobile ? '100%' : 80 }}>
                      {(form.category === 'shoes' ? SHOE_SIZES : CLOTHING_SIZES).map(sz => <option key={sz}>{sz}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>COLOUR</label>
                    <input value={newVariant.color} onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))} style={{ ...s.input, width: isMobile ? '100%' : 110 }} placeholder="e.g. Black" />
                  </div>
                  <div>
                    <label style={s.label}>HEX</label>
                    <input type="color" value={newVariant.colorHex} onChange={e => setNewVariant(v => ({ ...v, colorHex: e.target.value }))} style={{ width: isMobile ? '100%' : 44, height: 38, border: '1px solid #d0cdc9', cursor: 'pointer', padding: 2 }} />
                  </div>
                  <div>
                    <label style={s.label}>STOCK</label>
                    <input type="number" min="0" value={newVariant.stock} onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))} style={{ ...s.input, width: isMobile ? '100%' : 70 }} />
                  </div>
                  <div>
                    <label style={s.label}>SKU</label>
                    <input value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} style={{ ...s.input, width: isMobile ? '100%' : 100 }} placeholder="Optional" />
                  </div>
                  <button type="button" onClick={addVariant} style={{ ...s.btn, padding: '10px 14px', width: isMobile ? '100%' : 'auto' }}>+ ADD</button>
                </div>
              </div>
            </Section>

            {/* Images */}
            <Section title="IMAGES">
              {form.images.map((img, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '56px 1fr' : '48px 1fr auto auto', alignItems: 'center', gap: 10, marginBottom: 8, padding: '8px 10px', border: '1px solid #d0cdc9', minWidth: 0 }}>
                  <img src={img.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', background: '#ede9e3', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.url}</span>
                  {img.isPrimary
                    ? <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, background: '#2a7a2a', color: '#fff', padding: '2px 6px', flexShrink: 0 }}>PRIMARY</span>
                    : <button type="button" onClick={() => setPrimary(i)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, background: 'none', border: '1px solid #d0cdc9', padding: isMobile ? '6px 8px' : '2px 6px', cursor: 'pointer', flexShrink: 0 }}>SET PRIMARY</button>}
                  <button type="button" onClick={() => removeImage(i)} style={{ background: 'none', border: 'none', color: '#e03030', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL..." style={{ ...s.input, flex: 1 }} />
                <button type="button" onClick={addImage} style={{ ...s.btn, width: isMobile ? '100%' : 'auto' }}>+ URL</button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', border: '1px dashed #d0cdc9', background: '#faf9f7', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 10, marginTop: 4 }}>
                📁 Upload from computer
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={async e => {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;
                    const fd = new FormData();
                    files.forEach(f => fd.append('images', f));
                    try {
                      const res = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      res.data.urls.forEach((url, idx) => {
                        setForm(prev => ({ ...prev, images: [...prev.images, { url, alt: prev.name, isPrimary: prev.images.length === 0 && idx === 0 }] }));
                      });
                    } catch (err) {
                      setError('Upload failed. Add Cloudinary keys to .env or paste a URL instead.');
                    }
                  }}
                />
              </label>
              <button type="button" onClick={() => setMediaOpen(true)} style={{ ...s.secBtn, textAlign: 'center' }}>CHOOSE FROM MEDIA</button>
            </Section>

            {/* Save button at bottom of main column on mobile */}
            {isMobile && <SaveBtn />}
          </div>

          {/* ── SIDEBAR (desktop only) ── */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SettingsPanel form={form} set={set} isMobile={false} />
              <SaveBtn />
            </div>
          )}
        </div>
      </form>
      {mediaOpen && <MediaPicker onSelect={addImageFromMedia} onClose={() => setMediaOpen(false)} />}
    </div>
  );
}

function SettingsPanel({ form, set, isMobile }) {
  return (
    <>
      <Section title="ORGANISATION">
        <div>
          <label style={s.label}>CATEGORY</label>
          <select value={form.category} onChange={set('category')} style={s.input}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: 12 }}>
          <div>
            <label style={s.label}>GENDER</label>
            <select value={form.gender} onChange={set('gender')} style={s.input}>
              {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>BADGE</label>
            <select value={form.badge} onChange={set('badge')} style={s.input}>
              {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
            </select>
          </div>
        </div>
      </Section>
      <Section title="VISIBILITY">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} /> Published
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer', marginTop: 10 }}>
          <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /> Featured on homepage
        </label>
      </Section>
    </>
  );
}

function Section({ title, children }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <div style={{ border: '1px solid #d0cdc9', padding: isMobile ? 12 : 16, minWidth: 0 }}>
      <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 14, borderBottom: '1px solid #d0cdc9', paddingBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
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

const s = {
  btn:        { display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' },
  secBtn:     { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 14px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  label:      { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:      { width: '100%', boxSizing: 'border-box', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  th:         { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textAlign: 'left', padding: '6px 8px', letterSpacing: 1 },
  td:         { padding: '8px 8px', verticalAlign: 'middle' },
  errorBox:   { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 14px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 14px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)', marginBottom: 14 },
};
