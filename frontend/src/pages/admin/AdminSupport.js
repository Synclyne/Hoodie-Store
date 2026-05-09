import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '../../next/ReactRouterCompat';
import api from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const STATUSES = ['all', 'new', 'open', 'resolved', 'closed'];

export default function AdminSupport() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const countMap = useMemo(() => Object.fromEntries((counts || []).map((row) => [row._id, row.count])), [counts]);

  const load = async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/support/admin', { params: { status: nextStatus } });
      setMessages(res.data.messages || []);
      setCounts(res.data.counts || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load support messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  const update = async (id, patch) => {
    const res = await api.patch(`/support/admin/${id}`, patch);
    setMessages((prev) => prev.map((m) => (m._id === id ? res.data.message : m)));
  };

  const reply = async (id, payload) => {
    const res = await api.post(`/support/admin/${id}/replies`, payload);
    setMessages((prev) => prev.map((m) => (m._id === id ? res.data.message : m)));
    return res.data.email;
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this support message?')) return;
    await api.delete(`/support/admin/${id}`);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(34px,7vw,62px)', lineHeight: .9, marginBottom: 6 }}>SUPPORT</h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>Customer messages from the storefront support form.</p>
        </div>
        <Link to="/admin" style={s.secBtn}>DASHBOARD</Link>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {STATUSES.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            style={{ ...s.filterBtn, background: status === item ? '#0a0a0a' : 'transparent', color: status === item ? '#f5f3ef' : '#0a0a0a' }}
          >
            {item.toUpperCase()} {item !== 'all' ? `(${countMap[item] || 0})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : messages.length === 0 ? (
        <div style={s.empty}>No support messages here.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {messages.map((message) => (
            <MessageCard key={message._id} message={message} onUpdate={update} onReply={reply} onDelete={remove} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ message, onUpdate, onReply, onDelete, isMobile }) {
  const [note, setNote] = useState(message.adminNote || '');
  const [replyBody, setReplyBody] = useState('');
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyNotice, setReplyNotice] = useState('');
  const created = new Date(message.createdAt).toLocaleString();

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    setReplyNotice('');
    try {
      const email = await onReply(message._id, {
        message: replyBody,
        emailCustomer,
        status: message.status === 'new' ? 'open' : message.status,
      });
      setReplyBody('');
      setReplyNotice(email?.sent ? 'Reply saved and emailed.' : 'Reply saved. Email is not configured.');
    } catch (err) {
      setReplyNotice(err.response?.data?.error || 'Could not send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <article style={s.card}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 12 }}>
        <div>
          <p style={s.meta}>{created} / {message.status.toUpperCase()}</p>
          <h2 style={s.subject}>{message.subject}</h2>
          <p style={s.customer}>{message.name} / {message.email}{message.phone ? ` / ${message.phone}` : ''}</p>
          {message.orderNumber && <p style={s.customer}>Order: {message.orderNumber}</p>}
        </div>
        <select value={message.status} onChange={(e) => onUpdate(message._id, { status: e.target.value })} style={s.select}>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div style={s.thread}>
        {(message.thread?.length ? message.thread : [{ author: 'customer', body: message.message, createdAt: message.createdAt }]).map((item) => (
          <div
            key={item._id || `${item.author}-${item.createdAt}`}
            style={{
              ...s.bubble,
              alignSelf: item.author === 'admin' ? 'flex-end' : 'flex-start',
              background: item.author === 'admin' ? '#0a0a0a' : '#ede9e3',
              color: item.author === 'admin' ? '#f5f3ef' : '#0a0a0a',
            }}
          >
            <p style={s.bubbleMeta}>
              {item.author === 'admin' ? 'SUPPORT' : 'CUSTOMER'} / {new Date(item.createdAt).toLocaleString()}
              {item.emailed ? ' / EMAILED' : ''}
            </p>
            <p style={s.bubbleText}>{item.body}</p>
          </div>
        ))}
      </div>

      <label style={s.label}>REPLY</label>
      <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={4} style={s.note} placeholder="Type a support reply..." />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#666', marginTop: 8 }}>
        <input type="checkbox" checked={emailCustomer} onChange={(e) => setEmailCustomer(e.target.checked)} style={{ accentColor: '#0a0a0a' }} />
        Email this reply to the customer
      </label>
      {replyNotice && <div style={replyNotice.includes('Could not') ? s.errorBox : s.successBox}>{replyNotice}</div>}

      <label style={s.label}>ADMIN NOTE</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={s.note} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={s.btn} disabled={sending} onClick={sendReply}>{sending ? 'SENDING...' : 'SEND REPLY'}</button>
        <button style={s.btn} onClick={() => onUpdate(message._id, { adminNote: note })}>SAVE NOTE</button>
        <button style={s.secBtn} onClick={() => onUpdate(message._id, { status: 'resolved' })}>RESOLVE</button>
        <button style={s.secBtn} onClick={() => onUpdate(message._id, { status: 'closed' })}>CLOSE CHAT</button>
        {message.status === 'closed' && <button style={s.secBtn} onClick={() => onUpdate(message._id, { status: 'open' })}>REOPEN</button>}
        <button style={s.dangerBtn} onClick={() => onDelete(message._id)}>DELETE</button>
      </div>
    </article>
  );
}

const s = {
  card: { border: '1px solid #d0cdc9', padding: 16, background: '#f5f3ef' },
  meta: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 5 },
  subject: { fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, marginBottom: 8 },
  customer: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#666', lineHeight: 1.7 },
  thread: { display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #d0cdc9', padding: 12, margin: '14px 0', maxHeight: 360, overflowY: 'auto' },
  bubble: { width: 'min(88%, 620px)', padding: '10px 12px', border: '1px solid #d0cdc9' },
  bubbleMeta: { fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: 1.2, opacity: .62, marginBottom: 6 },
  bubbleText: { fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  label: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  note: { width: '100%', border: '1px solid #d0cdc9', background: 'transparent', padding: 10, resize: 'vertical', fontSize: 13, outline: 'none' },
  select: { border: '1px solid #d0cdc9', background: 'transparent', padding: '9px 10px', fontFamily: 'Space Mono, monospace', fontSize: 10, alignSelf: 'start' },
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer' },
  secBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  dangerBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '9px 12px', background: 'transparent', color: '#e03030', border: '1px solid rgba(224,48,48,.35)', cursor: 'pointer' },
  filterBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, padding: '8px 11px', border: '1px solid #0a0a0a', cursor: 'pointer' },
  empty: { border: '1px solid #d0cdc9', padding: 24, fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 14px', background: 'rgba(224,48,48,.06)', border: '1px solid rgba(224,48,48,.2)', marginBottom: 14 },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 14px', background: 'rgba(42,122,42,.06)', border: '1px solid rgba(42,122,42,.2)', margin: '10px 0' },
};
