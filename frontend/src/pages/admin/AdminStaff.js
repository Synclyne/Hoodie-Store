import React, { useEffect, useState } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useAuth } from '../../context/AuthContext';

const PERMISSION_LABELS = {
  homepage: 'Homepage',
  products: 'Products',
  orders: 'Orders',
  shipping: 'Shipping',
  coupons: 'Coupons',
  settings: 'Settings',
  support: 'Support',
  staff: 'Staff',
};

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  adminType: 'staff',
  permissions: ['orders'],
};

export default function AdminStaff() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState(Object.keys(PERMISSION_LABELS));
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/staff');
      setAdmins(res.data.admins || []);
      setPermissions(res.data.permissions || Object.keys(PERMISSION_LABELS));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const toggleFormPermission = (permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(permission)
        ? f.permissions.filter((p) => p !== permission)
        : [...f.permissions, permission],
    }));
  };

  const toggleAdminPermission = async (admin, permission) => {
    const nextPermissions = admin.adminPermissions?.includes(permission)
      ? admin.adminPermissions.filter((p) => p !== permission)
      : [...(admin.adminPermissions || []), permission];

    await updateAdmin(admin._id, { permissions: nextPermissions });
  };

  const updateAdmin = async (id, payload) => {
    setError('');
    try {
      await api.put(`/admin/staff/${id}`, payload);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update admin.');
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/staff', form);
      setForm(emptyForm);
      setSuccess('Admin saved.');
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save admin.');
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (admin) => {
    if (!window.confirm(`Remove admin access for ${admin.email}?`)) return;
    setError('');
    try {
      await api.delete(`/admin/staff/${admin._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove admin access.');
    }
  };

  if (loading) return <div className="page-loading">Loading staff...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,7vw,56px)', lineHeight: .9, marginBottom: 6 }}>STAFF</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Manage owner admins and sub-admin permissions.</p>
        </div>
        <Link to="/admin" style={s.secBtn}>← DASHBOARD</Link>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {success && <div style={s.successBox}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: 20, alignItems: 'start' }}>
        <form onSubmit={addAdmin} style={s.panel}>
          <h3 style={s.title}>ADD OR PROMOTE ADMIN</h3>
          <Field label="FIRST NAME" value={form.firstName} onChange={set('firstName')} />
          <Field label="LAST NAME" value={form.lastName} onChange={set('lastName')} />
          <Field label="EMAIL" type="email" value={form.email} onChange={set('email')} required />
          <Field label="PASSWORD (new users only)" type="password" value={form.password} onChange={set('password')} />
          <div>
            <label style={s.label}>ADMIN TYPE</label>
            <select value={form.adminType} onChange={set('adminType')} style={s.input}>
              <option value="staff">Sub admin</option>
              <option value="owner">Main admin</option>
            </select>
          </div>

          {form.adminType === 'staff' && (
            <PermissionGrid
              permissions={permissions}
              selected={form.permissions}
              onToggle={toggleFormPermission}
            />
          )}

          <button type="submit" disabled={saving} style={{ ...s.btn, width: '100%', marginTop: 4 }}>
            {saving ? 'SAVING...' : 'SAVE ADMIN'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {admins.map((admin) => {
            const isSelf = String(admin._id) === String(user?._id);
            const owner = admin.adminType === 'owner' || !admin.adminType;
            return (
              <div key={admin._id} style={s.panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13 }}>{admin.firstName} {admin.lastName}</p>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{admin.email}</p>
                  </div>
                  <span style={{ ...s.pill, background: owner ? '#0a0a0a' : '#ede9e3', color: owner ? '#f5f3ef' : '#0a0a0a' }}>
                    {owner ? 'MAIN ADMIN' : 'SUB ADMIN'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: owner ? 0 : 12 }}>
                  <button type="button" disabled={isSelf} onClick={() => updateAdmin(admin._id, { adminType: owner ? 'staff' : 'owner', permissions: admin.adminPermissions || [] })} style={s.secBtn}>
                    {owner ? 'MAKE SUB ADMIN' : 'MAKE MAIN ADMIN'}
                  </button>
                  <button type="button" disabled={isSelf} onClick={() => updateAdmin(admin._id, { isActive: !admin.isActive })} style={s.secBtn}>
                    {admin.isActive ? 'DEACTIVATE' : 'REACTIVATE'}
                  </button>
                  <button type="button" disabled={isSelf} onClick={() => removeAdmin(admin)} style={{ ...s.secBtn, color: '#e03030' }}>
                    REMOVE ADMIN
                  </button>
                </div>

                {!owner && (
                  <PermissionGrid
                    permissions={permissions}
                    selected={admin.adminPermissions || []}
                    onToggle={(permission) => toggleAdminPermission(admin, permission)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PermissionGrid({ permissions, selected, onToggle }) {
  return (
    <div>
      <label style={s.label}>PERMISSIONS</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
        {permissions.map((permission) => (
          <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Space Mono, monospace', fontSize: 9, border: '1px solid #d0cdc9', padding: '8px 9px', cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.includes(permission)} onChange={() => onToggle(permission)} />
            {PERMISSION_LABELS[permission] || permission}
          </label>
        ))}
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
  panel: { border: '1px solid #d0cdc9', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#f5f3ef' },
  title: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#888', borderBottom: '1px solid #d0cdc9', paddingBottom: 8 },
  label: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer' },
  secBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '8px 11px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  pill: { fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1, padding: '5px 8px', alignSelf: 'flex-start' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 14px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 14px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)', marginBottom: 14 },
};
