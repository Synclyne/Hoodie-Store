import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = () => { logout(); navigate('/'); };

  const TABS = [
    { id: 'profile',  label: 'Profile'          },
    { id: 'password', label: 'Password'          },
    { id: 'address',  label: 'Addresses'         },
    { id: 'viewed',   label: 'Recently Viewed'   },
  ];

  return (
    <div style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px,8vw,80px)', lineHeight: .9, marginBottom: 6 }}>MY ACCOUNT</h1>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Hello, {user?.firstName} {user?.lastName}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/account/orders" style={s.secBtn}>MY ORDERS</Link>
            <button onClick={handleLogout} style={s.ghostBtn}>SIGN OUT</button>
          </div>
        </div>

        {/* Tab nav — horizontal scroll on mobile */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, overflowX: 'auto', borderBottom: '1px solid #d0cdc9' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1,
                padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                borderBottom: activeTab === tab.id ? '2px solid #0a0a0a' : '2px solid transparent',
                color: activeTab === tab.id ? '#0a0a0a' : '#888',
                fontWeight: activeTab === tab.id ? 700 : 400,
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ maxWidth: 560 }}>
          {activeTab === 'profile'  && <ProfileForm  user={user} />}
          {activeTab === 'password' && <PasswordForm />}
          {activeTab === 'address'  && <AddressForm  user={user} />}
          {activeTab === 'viewed'   && <RecentlyViewed />}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const { updateUser } = useAuth();
  const [form,   setForm]   = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' });
  const [status, setStatus] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus('saving');
    try {
      const res = await api.put('/auth/me', form);
      updateUser(res.data.user);
      setStatus('success'); setTimeout(() => setStatus(''), 3000);
    } catch (err) { setStatus(err.response?.data?.error || 'Update failed.'); }
  };

  return (
    <div>
      <h2 style={s.sectionTitle}>PROFILE</h2>
      {status === 'success' && <Banner type="success">Profile updated.</Banner>}
      {status && status !== 'saving' && status !== 'success' && <Banner type="error">{status}</Banner>}
      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.twoCol}>
          <FormField label="FIRST NAME" value={form.firstName} onChange={set('firstName')} />
          <FormField label="LAST NAME"  value={form.lastName}  onChange={set('lastName')}  />
        </div>
        <FormField label="EMAIL" type="email" value={form.email} onChange={set('email')} />
        <SubmitBtn loading={status === 'saving'}>SAVE CHANGES</SubmitBtn>
      </form>
    </div>
  );
}

function PasswordForm() {
  const [form,   setForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [status, setStatus] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setStatus('Passwords do not match.'); return; }
    if (form.newPassword.length < 8) { setStatus('Password must be at least 8 characters.'); return; }
    setStatus('saving');
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setStatus('success');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setStatus(''), 3000);
    } catch (err) { setStatus(err.response?.data?.error || 'Failed.'); }
  };

  return (
    <div>
      <h2 style={s.sectionTitle}>CHANGE PASSWORD</h2>
      {status === 'success' && <Banner type="success">Password changed.</Banner>}
      {status && status !== 'saving' && status !== 'success' && <Banner type="error">{status}</Banner>}
      <form onSubmit={handleSubmit} style={s.form}>
        <FormField label="CURRENT PASSWORD" type="password" value={form.currentPassword} onChange={set('currentPassword')} />
        <FormField label="NEW PASSWORD"     type="password" value={form.newPassword}     onChange={set('newPassword')}     />
        <FormField label="CONFIRM"          type="password" value={form.confirm}          onChange={set('confirm')}          />
        <SubmitBtn loading={status === 'saving'}>UPDATE PASSWORD</SubmitBtn>
      </form>
    </div>
  );
}

function AddressForm({ user }) {
  const { updateUser } = useAuth();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [defaultAddress, setDefaultAddress] = useState(user?.defaultAddress || 0);
  const [showForm,  setShowForm]  = useState(false);
  const [status,    setStatus]    = useState('');
  const [newAddr,   setNewAddr]   = useState({ fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'KE', phone: '' });
  const setA = k => e => setNewAddr(a => ({ ...a, [k]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault(); setStatus('saving');
    try {
      const updated = [...addresses, newAddr];
      const res = await api.put('/auth/me', { addresses: updated, defaultAddress: addresses.length ? defaultAddress : 0 });
      setAddresses(updated); setDefaultAddress(res.data.user.defaultAddress || 0); updateUser(res.data.user); setShowForm(false);
      setNewAddr({ fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'KE', phone: '' });
      setStatus('');
    } catch (err) { setStatus(err.response?.data?.error || 'Failed.'); }
  };

  const handleRemove = async (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    const nextDefault = Math.max(0, Math.min(defaultAddress > idx ? defaultAddress - 1 : defaultAddress, updated.length - 1));
    const res = await api.put('/auth/me', { addresses: updated, defaultAddress: nextDefault });
    setAddresses(updated);
    setDefaultAddress(nextDefault);
    updateUser(res.data.user);
  };

  const handleMakeDefault = async (idx) => {
    const res = await api.put('/auth/me', { defaultAddress: idx });
    setDefaultAddress(idx);
    updateUser(res.data.user);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>ADDRESSES</h2>
        <button onClick={() => setShowForm(v => !v)} style={s.secBtn}>{showForm ? 'CANCEL' : '+ ADD'}</button>
      </div>
      {status && status !== 'saving' && <Banner type="error">{status}</Banner>}
      {!addresses.length && !showForm && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' }}>No saved addresses.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: showForm ? 20 : 0 }}>
        {addresses.map((addr, i) => (
          <div key={i} style={{ border: '1px solid #d0cdc9', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666', lineHeight: 1.8 }}>
              <strong style={{ color: '#0a0a0a' }}>{addr.fullName}</strong><br />
              {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
              {addr.city}, {addr.state} {addr.postalCode} · {addr.phone}
            </div>
            <button onClick={() => handleRemove(i)} style={{ background: 'none', border: 'none', color: '#e03030', fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer', flexShrink: 0, textDecoration: 'underline' }}>Remove</button>
            {defaultAddress === i ? (
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#2a7a2a', flexShrink: 0 }}>DEFAULT</span>
            ) : (
              <button onClick={() => handleMakeDefault(i)} style={{ background: 'none', border: 'none', color: '#888', fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer', flexShrink: 0, textDecoration: 'underline' }}>Default</button>
            )}
          </div>
        ))}
      </div>
      {showForm && (
        <form onSubmit={handleAdd} style={{ ...s.form, border: '1px solid #d0cdc9', padding: 18 }}>
          <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>NEW ADDRESS</h3>
          <div style={s.twoCol}>
            <FormField label="FULL NAME" value={newAddr.fullName} onChange={setA('fullName')} required />
            <FormField label="PHONE"     value={newAddr.phone}    onChange={setA('phone')}    required />
          </div>
          <FormField label="LINE 1" value={newAddr.line1} onChange={setA('line1')} required />
          <FormField label="LINE 2 (OPTIONAL)" value={newAddr.line2} onChange={setA('line2')} />
          <div style={s.twoCol}>
            <FormField label="CITY"  value={newAddr.city}  onChange={setA('city')}  required />
            <FormField label="STATE" value={newAddr.state} onChange={setA('state')} required />
          </div>
          <div style={s.twoCol}>
            <FormField label="POSTAL CODE" value={newAddr.postalCode} onChange={setA('postalCode')} required />
            <div>
              <label style={s.label}>COUNTRY</label>
              <select value={newAddr.country} onChange={setA('country')} style={s.input}>
                <option value="KE">Kenya</option>
                <option value="UG">Uganda</option>
                <option value="TZ">Tanzania</option>
                <option value="RW">Rwanda</option>
                <option value="ET">Ethiopia</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
              </select>
            </div>
          </div>
          <SubmitBtn loading={status === 'saving'}>SAVE ADDRESS</SubmitBtn>
        </form>
      )}
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} style={s.input} />
    </div>
  );
}

function SubmitBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: '12px 24px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', opacity: loading ? .7 : 1 }}>
      {loading ? 'SAVING...' : children}
    </button>
  );
}

function Banner({ type, children }) {
  const isSuccess = type === 'success';
  return (
    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: isSuccess ? '#2a7a2a' : '#e03030', background: isSuccess ? 'rgba(42,122,42,.08)' : 'rgba(224,48,48,.06)', border: `1px solid ${isSuccess ? 'rgba(42,122,42,.25)' : 'rgba(224,48,48,.25)'}`, padding: '10px 14px', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function RecentlyViewed() {
  const [products, setProducts] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);

  React.useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('hoodie_viewed') || '[]').slice(0, 8);
    if (!ids.length) { setLoading(false); return; }
    // Fetch each product by id
    Promise.all(ids.map(id => api.get(`/products/id/${id}`).then(r => r.data.product).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' }}>Loading...</p>;
  if (!products.length) return (
    <div>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, marginBottom: 12 }}>RECENTLY VIEWED</h2>
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' }}>No recently viewed products yet. Start browsing!</p>
      <Link to="/shop" style={{ display: 'inline-block', marginTop: 14, fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 20px', background: '#0a0a0a', color: '#f5f3ef', textDecoration: 'none' }}>SHOP NOW</Link>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, marginBottom: 16 }}>RECENTLY VIEWED</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#d0cdc9' }}>
        {products.map(p => {
          const img = p.images?.find(i => i.isPrimary) || p.images?.[0];
          return (
            <Link key={p._id} to={`/product/${p.slug}`} style={{ background: '#f5f3ef', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#ede9e3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {img ? <img src={img.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ opacity: .2, fontSize: 36 }}>👕</span>}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{p.name}</p>
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>KSh {Number(p.price).toLocaleString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  sectionTitle: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px,4vw,32px)', marginBottom: 20 },
  form:         { display: 'flex', flexDirection: 'column', gap: 14 },
  twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label:        { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:        { width: '100%', border: '1px solid #d0cdc9', padding: '11px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  secBtn:       { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '9px 16px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
  ghostBtn:     { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '9px 16px', background: 'transparent', color: '#888', border: '1px solid #d0cdc9', cursor: 'pointer' },
};
