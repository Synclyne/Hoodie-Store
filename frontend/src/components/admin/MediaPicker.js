import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function MediaPicker({ onSelect, onClose }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/media', { params: { limit: 40 } })
      .then(res => setAssets(res.data.assets || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.modal}>
        <div style={s.head}>
          <div>
            <h3 style={s.title}>MEDIA LIBRARY</h3>
            <p style={s.sub}>Choose an uploaded image</p>
          </div>
          <button type="button" onClick={onClose} style={s.close}>x</button>
        </div>
        {loading ? <div className="page-loading">Loading...</div> : (
          <div style={s.grid}>
            {assets.map(asset => (
              <button
                type="button"
                key={asset._id}
                onClick={() => { onSelect(asset.url); onClose(); }}
                style={s.item}
              >
                <img src={asset.url} alt="" style={s.img} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900 },
  modal: { position: 'fixed', top: '8vh', left: '50%', transform: 'translateX(-50%)', width: 'min(760px, calc(100vw - 28px))', maxHeight: '84vh', overflowY: 'auto', background: '#f5f3ef', border: '1px solid #d0cdc9', zIndex: 901 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', borderBottom: '1px solid #d0cdc9' },
  title: { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2 },
  sub: { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 },
  close: { background: 'none', border: '1px solid #d0cdc9', fontFamily: 'Space Mono, monospace', fontSize: 10, padding: '5px 9px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 1, background: '#d0cdc9' },
  item: { aspectRatio: '1', border: 'none', background: '#ede9e3', padding: 0, cursor: 'pointer', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
};
