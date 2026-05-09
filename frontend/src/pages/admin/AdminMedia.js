import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

export default function AdminMedia() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/media', { params: { page, limit: 30 } });
      setAssets(res.data.assets || []);
      setPagination(res.data.pagination || {});
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    setUploading(true);
    try {
      await api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPage(1);
      fetchAssets();
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = async (asset) => {
    if (!window.confirm('Remove this image from the media library?')) return;
    await api.delete(`/admin/media/${asset._id}`);
    fetchAssets();
  };

  const copyUrl = async (url) => {
    await navigator.clipboard?.writeText(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>MEDIA</h1>
          <p style={s.sub}>{pagination.total || 0} images</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={s.btn}>
            {uploading ? 'UPLOADING...' : '+ UPLOAD'}
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => uploadFiles(Array.from(e.target.files || []))} />
          </label>
          <Link to="/admin" style={s.secBtn}>← BACK</Link>
        </div>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 1, background: '#d0cdc9' }}>
          {assets.map(asset => (
            <div key={asset._id} style={{ background: '#f5f3ef' }}>
              <div style={{ aspectRatio: '1', background: '#ede9e3', overflow: 'hidden' }}>
                <img src={asset.url} alt={asset.originalName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: 10 }}>
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                  {asset.originalName || asset.source}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => copyUrl(asset.url)} style={s.actionBtn}>COPY</button>
                  <button type="button" onClick={() => removeAsset(asset)} style={{ ...s.actionBtn, color: '#e03030', borderColor: '#e03030' }}>REMOVE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '24px 0', flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '6px 12px', background: page === p ? '#0a0a0a' : 'transparent', color: page === p ? '#f5f3ef' : '#0a0a0a', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
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
  actionBtn: { fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: .5, padding: '4px 8px', background: 'transparent', border: '1px solid #d0cdc9', cursor: 'pointer' },
};
