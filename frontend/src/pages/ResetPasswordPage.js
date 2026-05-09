import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from '../next/ReactRouterCompat';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const token = searchParams.get('token');

  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [status,  setStatus]  = useState('idle');
  const [error,   setError]   = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <Link to="/" style={s.logo}>{settings.storeName || 'HOODIE'}</Link>
          <h1 style={s.title}>INVALID LINK</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 20 }}>
            This reset link is missing or invalid.
          </p>
          <Link to="/forgot-password" style={{ ...s.btn, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            REQUEST NEW LINK
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setStatus('loading');
    try {
      const res = await api.post('/auth/reset-password', { token, password: form.password });
      // Backend logs user in — save token
      localStorage.setItem('hoodie_token', res.data.token);
      localStorage.setItem('hoodie_user',  JSON.stringify(res.data.user));
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
      setStatus('idle');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>{settings.storeName || 'HOODIE'}</Link>
        <h1 style={s.title}>NEW PASSWORD</h1>
        <p style={s.sub}>Choose a strong password for your account.</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div>
            <label style={s.label}>NEW PASSWORD</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              style={s.input}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label style={s.label}>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              required
              style={s.input}
              placeholder="Repeat your password"
            />
          </div>
          <button type="submit" style={s.btn} disabled={status === 'loading'}>
            {status === 'loading' ? 'SAVING...' : 'SET NEW PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', padding: 16 },
  card:     { width: '100%', maxWidth: 400, padding: 'clamp(28px,5vw,48px) clamp(20px,5vw,40px)', border: '1px solid #d0cdc9' },
  logo:     { display: 'block', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: 4, color: '#0a0a0a', textDecoration: 'none', marginBottom: 20 },
  title:    { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px,5vw,32px)', letterSpacing: 2, marginBottom: 4 },
  sub:      { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 24, lineHeight: 1.7 },
  form:     { display: 'flex', flexDirection: 'column', gap: 16 },
  label:    { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:    { width: '100%', border: '1px solid #d0cdc9', padding: '11px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  btn:      { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: 14, background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 12px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 4 },
};
