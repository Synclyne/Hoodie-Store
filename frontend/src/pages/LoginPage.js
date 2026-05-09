import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from '../next/ReactRouterCompat';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export function LoginPage() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>{settings.storeName || 'HOODIE'}</Link>
        <h1 style={s.title}>WELCOME BACK</h1>
        <p style={s.sub}>Sign in to your account</p>
        {error && <div style={s.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <Field label="EMAIL"    type="email"    value={form.email}    onChange={set('email')}    required />
          <Field label="PASSWORD" type="password" value={form.password} onChange={set('password')} required />
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'none', borderBottom: '1px solid #d0cdc9' }}>
              Forgot password?
            </Link>
          </div>
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        <p style={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>{settings.storeName || 'HOODIE'}</Link>
        <h1 style={s.title}>CREATE ACCOUNT</h1>
        <p style={s.sub}>Join the {settings.storeName || 'HOODIE'} family</p>
        {error && <div style={s.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.twoCol}>
            <Field label="FIRST NAME" value={form.firstName} onChange={set('firstName')} required />
            <Field label="LAST NAME"  value={form.lastName}  onChange={set('lastName')}  required />
          </div>
          <Field label="EMAIL"            type="email"    value={form.email}    onChange={set('email')}    required />
          <Field label="PASSWORD"         type="password" value={form.password} onChange={set('password')} required />
          <Field label="CONFIRM PASSWORD" type="password" value={form.confirm}  onChange={set('confirm')}  required />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} style={s.input} />
    </div>
  );
}

const s = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', padding: 16 },
  card:     { width: '100%', maxWidth: 420, padding: 'clamp(28px, 5vw, 48px) clamp(20px, 5vw, 40px)', border: '1px solid #d0cdc9' },
  logo:     { display: 'block', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: 4, color: '#0a0a0a', textDecoration: 'none', marginBottom: 20 },
  title:    { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,6vw,36px)', letterSpacing: 2, marginBottom: 4 },
  sub:      { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 24 },
  form:     { display: 'flex', flexDirection: 'column', gap: 14 },
  twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label:    { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:    { width: '100%', border: '1px solid #d0cdc9', padding: '11px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  btn:      { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: 14, background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer', marginTop: 4 },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 12px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  footer:   { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', textAlign: 'center', marginTop: 20 },
  link:     { color: '#0a0a0a', borderBottom: '1px solid #0a0a0a' },
};

export default LoginPage;
