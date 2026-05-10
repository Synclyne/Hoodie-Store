import React, { useEffect, useState } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const STATUSES = ['pending', 'approved', 'all'];

export default function AdminReviews() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [status, setStatus] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const load = async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reviews', { params: { status: nextStatus } });
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  const updateReview = async (item, approved) => {
    setWorkingId(item.review._id);
    setNotice('');
    setError('');
    try {
      await api.patch(`/admin/products/${item.productId}/reviews/${item.review._id}`, { approved });
      setNotice(approved ? 'Review approved.' : 'Review moved back to pending.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update review.');
    } finally {
      setWorkingId('');
    }
  };

  const deleteReview = async (item) => {
    if (!window.confirm('Delete this review?')) return;
    setWorkingId(item.review._id);
    setNotice('');
    setError('');
    try {
      await api.delete(`/admin/products/${item.productId}/reviews/${item.review._id}`);
      setNotice('Review deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete review.');
    } finally {
      setWorkingId('');
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(34px,7vw,62px)', lineHeight: .9, marginBottom: 6 }}>REVIEWS</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Approve customer reviews before they appear publicly.</p>
        </div>
        <Link to="/admin" style={s.secBtn}>DASHBOARD</Link>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {notice && <div style={s.successBox}>{notice}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {STATUSES.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            style={{ ...s.filterBtn, background: status === item ? '#0a0a0a' : 'transparent', color: status === item ? '#f5f3ef' : '#0a0a0a' }}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : reviews.length === 0 ? (
        <div style={s.empty}>No reviews here.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {reviews.map((item) => {
            const review = item.review;
            const approved = review.approved !== false;
            const busy = workingId === review._id;
            return (
              <article key={`${item.productId}-${review._id}`} style={s.card}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 12 }}>
                  <div>
                    <p style={s.meta}>{new Date(review.createdAt).toLocaleString()} / {approved ? 'APPROVED' : 'PENDING'}</p>
                    <h2 style={s.product}>{item.productName}</h2>
                    <p style={s.customer}>{review.name} / {review.user?.email || 'customer'}</p>
                    <p style={s.stars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                  </div>
                  <Link to={`/product/${item.productSlug}`} target="_blank" style={s.secBtn}>VIEW PRODUCT</Link>
                </div>
                <p style={s.comment}>{review.comment}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!approved && <button disabled={busy} onClick={() => updateReview(item, true)} style={s.btn}>APPROVE</button>}
                  {approved && <button disabled={busy} onClick={() => updateReview(item, false)} style={s.secBtn}>UNAPPROVE</button>}
                  <button disabled={busy} onClick={() => deleteReview(item)} style={s.dangerBtn}>DELETE</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  card: { border: '1px solid #d0cdc9', padding: 16, background: '#f5f3ef' },
  meta: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 5 },
  product: { fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, marginBottom: 8 },
  customer: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#666', lineHeight: 1.7 },
  stars: { color: '#f0a500', letterSpacing: 2, marginTop: 8 },
  comment: { fontSize: 14, lineHeight: 1.7, color: '#444', border: '1px solid #d0cdc9', padding: 12, margin: '14px 0', whiteSpace: 'pre-wrap' },
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer' },
  secBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
  dangerBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: 'transparent', color: '#e03030', border: '1px solid rgba(224,48,48,.35)', cursor: 'pointer' },
  filterBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '8px 11px', border: '1px solid #0a0a0a', cursor: 'pointer' },
  empty: { border: '1px solid #d0cdc9', padding: 24, fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 14px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 14px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)', marginBottom: 14 },
};
