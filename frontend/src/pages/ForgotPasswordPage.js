import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | sent | error
  const [message, setMessage] = useState('');
  const { settings } = useSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setStatus('sent');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>{settings.storeName || 'HOODIE'}</Link>
        <h1 style={s.title}>FORGOT PASSWORD</h1>
        <p style={s.sub}>Enter your email and we'll send you a reset link.</p>

        {status === 'sent' ? (
          <div style={s.successBox}>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#2a7a2a', lineHeight: 1.7 }}>
              ✓ {message}
            </p>
            <Link to="/login" style={{ ...s.btn, display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'none' }}>
              BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            {status === 'error' && (
              <div style={s.errorBox}>{message}</div>
            )}
            <div>
              <label style={s.label}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={s.input}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" style={s.btn} disabled={status === 'loading'}>
              {status === 'loading' ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
            <Link to="/login" style={s.backLink}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', padding: 16 },
  card:       { width: '100%', maxWidth: 400, padding: 'clamp(28px,5vw,48px) clamp(20px,5vw,40px)', border: '1px solid #d0cdc9' },
  logo:       { display: 'block', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: 4, color: '#0a0a0a', textDecoration: 'none', marginBottom: 20 },
  title:      { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px,5vw,32px)', letterSpacing: 2, marginBottom: 4 },
  sub:        { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 24, lineHeight: 1.7 },
  form:       { display: 'flex', flexDirection: 'column', gap: 16 },
  label:      { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:      { width: '100%', border: '1px solid #d0cdc9', padding: '11px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  btn:        { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: 14, background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' },
  backLink:   { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', textDecoration: 'none', textAlign: 'center' },
  errorBox:   { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 12px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)' },
  successBox: { padding: '16px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)' },
};
