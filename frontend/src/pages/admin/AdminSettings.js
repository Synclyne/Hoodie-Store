import React, { useEffect, useState } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const DEFAULT_SETTINGS = {
  storeName: 'HOODIE',
  logoUrl: '',
  supportEmail: '',
  whatsappNumber: '254700000000',
  currencyCode: 'KES',
  currencyLabel: 'KSh',
  freeShippingVisible: true,
  freeShippingText: 'FREE SHIPPING ON ORDERS OVER KSh 5,000',
  locationName: '',
  locationAddress: '',
  mapEmbedUrl: '',
  socialLinks: { instagram: '', telegram: '', facebook: '', x: '' },
  policyLinks: { returns: '', shipping: '', privacy: '', terms: '' },
};

const mergeSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(settings.socialLinks || {}) },
  policyLinks: {
    returns: '',
    shipping: '',
    privacy: '/privacy-policy',
    terms: '/terms-and-conditions',
    ...(settings.policyLinks || {}),
  },
});

export default function AdminSettings() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/admin')
      .then(r => setSettings(mergeSettings(r.data.settings)))
      .catch(err => setError(err.response?.data?.error || 'Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setSettings(prev => ({ ...prev, [key]: e.target.value }));
  const setChecked = (key) => (e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }));
  const setNested = (group, key) => (e) => setSettings(prev => ({
    ...prev,
    [group]: { ...(prev[group] || {}), [key]: e.target.value },
  }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.put('/settings/admin', settings);
      setSettings(mergeSettings(res.data.settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading settings...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 6 }}>SETTINGS</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Store info, links, contact details and storefront defaults.</p>
        </div>
        <Link to="/admin" style={s.secBtn}>← DASHBOARD</Link>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {saved && <div style={s.successBox}>Settings saved.</div>}

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Section title="STORE INFO">
          <TwoCol isMobile={isMobile}>
            <Field label="STORE NAME" value={settings.storeName} onChange={set('storeName')} />
            <Field label="LOGO URL" value={settings.logoUrl || ''} onChange={set('logoUrl')} />
          </TwoCol>
          <TwoCol isMobile={isMobile}>
            <Field label="SUPPORT EMAIL" type="email" value={settings.supportEmail || ''} onChange={set('supportEmail')} />
            <Field label="WHATSAPP NUMBER" value={settings.whatsappNumber || ''} onChange={set('whatsappNumber')} />
          </TwoCol>
          <TwoCol isMobile={isMobile}>
            <Field label="CURRENCY CODE" value={settings.currencyCode || ''} onChange={set('currencyCode')} />
            <Field label="CURRENCY LABEL" value={settings.currencyLabel || ''} onChange={set('currencyLabel')} />
          </TwoCol>
          <Toggle label="Show free shipping bar at the top of the site" checked={settings.freeShippingVisible !== false} onChange={setChecked('freeShippingVisible')} />
          <Field label="FREE SHIPPING TEXT" value={settings.freeShippingText || ''} onChange={set('freeShippingText')} />
        </Section>

        <Section title="STORE LOCATION">
          <TwoCol isMobile={isMobile}>
            <Field label="LOCATION NAME" value={settings.locationName || ''} onChange={set('locationName')} />
            <Field label="LOCATION ADDRESS" value={settings.locationAddress || ''} onChange={set('locationAddress')} />
          </TwoCol>
          <Field label="GOOGLE MAPS EMBED URL OR IFRAME CODE" value={settings.mapEmbedUrl || ''} onChange={set('mapEmbedUrl')} />
        </Section>

        <Section title="SOCIAL LINKS">
          <TwoCol isMobile={isMobile}>
            <Field label="INSTAGRAM URL" value={settings.socialLinks?.instagram || ''} onChange={setNested('socialLinks', 'instagram')} />
            <Field label="TELEGRAM URL" value={settings.socialLinks?.telegram || ''} onChange={setNested('socialLinks', 'telegram')} />
          </TwoCol>
          <TwoCol isMobile={isMobile}>
            <Field label="FACEBOOK URL" value={settings.socialLinks?.facebook || ''} onChange={setNested('socialLinks', 'facebook')} />
            <Field label="X URL" value={settings.socialLinks?.x || ''} onChange={setNested('socialLinks', 'x')} />
          </TwoCol>
        </Section>

        <Section title="POLICY LINKS">
          <TwoCol isMobile={isMobile}>
            <Field label="RETURNS URL" value={settings.policyLinks?.returns || ''} onChange={setNested('policyLinks', 'returns')} />
            <Field label="SHIPPING URL" value={settings.policyLinks?.shipping || ''} onChange={setNested('policyLinks', 'shipping')} />
          </TwoCol>
          <TwoCol isMobile={isMobile}>
            <Field label="PRIVACY URL" value={settings.policyLinks?.privacy || '/privacy-policy'} onChange={setNested('policyLinks', 'privacy')} />
            <Field label="TERMS URL" value={settings.policyLinks?.terms || '/terms-and-conditions'} onChange={setNested('policyLinks', 'terms')} />
          </TwoCol>
        </Section>

        <button type="submit" disabled={saving} style={{ ...s.btn, alignSelf: isMobile ? 'stretch' : 'flex-start' }}>
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ border: '1px solid #d0cdc9', padding: 16 }}>
      <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#888', borderBottom: '1px solid #d0cdc9', paddingBottom: 8, marginBottom: 14 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function TwoCol({ children, isMobile }) {
  return <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} style={s.input} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#0a0a0a', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#0a0a0a', width: 15, height: 15 }} />
      {label}
    </label>
  );
}

const s = {
  label: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer' },
  secBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 14px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 14px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)', marginBottom: 14 },
};
