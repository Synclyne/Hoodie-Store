import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from '../next/ReactRouterCompat';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import useMediaQuery from '../hooks/useMediaQuery';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  orderNumber: '',
  subject: '',
  message: '',
};

export default function SupportPage() {
  const { settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket') || '';
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState(initialForm);
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState('');
  const threadRef = useRef(null);
  const chatClosed = ticket?.status === 'closed';
  const threadHeight = isMobile ? 'min(64vh, 520px)' : 'min(62vh, 620px)';

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [ticket?.thread?.length]);

  useEffect(() => {
    if (!ticketId || !token) return;
    setStatus('loading');
    api.get(`/support/ticket/${ticketId}`, { params: { token } })
      .then((res) => {
        setTicket(res.data.ticket);
        setStatus('idle');
      })
      .catch((err) => {
        setStatus('error');
        setNotice(err.response?.data?.error || 'Could not load this support chat.');
      });
  }, [ticketId, token]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setNotice('');

    try {
      const res = await api.post('/support', form);
      setForm(initialForm);
      const nextTicket = res.data.ticket;
      setStatus('sent');
      setNotice('Message received. Keep this page link to continue the chat.');
      navigate(`/support?ticket=${nextTicket.id}&token=${nextTicket.accessToken}`, { replace: true });
    } catch (err) {
      setStatus('error');
      setNotice(err.response?.data?.error || 'Could not send your message. Please try again.');
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !ticketId || !token) return;
    setStatus('loading');
    setNotice('');

    try {
      const res = await api.post(`/support/ticket/${ticketId}/replies`, { token, message: reply });
      setTicket(res.data.ticket);
      setReply('');
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setNotice(err.response?.data?.error || 'Could not send your reply.');
    }
  };

  return (
    <main style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: isMobile ? '32px 16px 56px' : '54px 28px 80px' }}>
        <Link to="/" style={s.back}>BACK TO STORE</Link>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: isMobile ? 28 : 48, alignItems: 'start' }}>
          <div>
            <p style={s.eyebrow}>SUPPORT</p>
            <h1 style={s.title}>How can we help?</h1>
            <p style={s.copy}>
              Send us your order question, delivery issue, sizing concern, or anything else you need help with.
            </p>
            <div style={s.infoBox}>
              <p style={s.infoLabel}>STORE</p>
              <p style={s.infoText}>{settings.storeName || 'HOODIE'}</p>
              {settings.supportEmail && (
                <>
                  <p style={s.infoLabel}>EMAIL</p>
                  <p style={s.infoText}>{settings.supportEmail}</p>
                </>
              )}
              {settings.whatsappNumber && (
                <>
                  <p style={s.infoLabel}>WHATSAPP</p>
                  <p style={s.infoText}>+{settings.whatsappNumber}</p>
                </>
              )}
            </div>
          </div>

          {ticket ? (
            <div style={s.chatShell}>
              <div style={s.chatHeader}>
                <p style={s.infoLabel}>SUPPORT CHAT / {ticket.status.toUpperCase()}</p>
                <h2 style={s.chatTitle}>{ticket.subject}</h2>
                <p style={s.infoText}>{ticket.email}</p>
              </div>

              <div ref={threadRef} style={{ ...s.thread, height: threadHeight }}>
                {(ticket.thread || []).map((item) => (
                  <div
                    key={item._id || `${item.author}-${item.createdAt}`}
                    style={{
                      ...s.bubble,
                      alignSelf: item.author === 'customer' ? 'flex-end' : 'flex-start',
                      background: item.author === 'customer' ? '#0a0a0a' : '#ede9e3',
                      color: item.author === 'customer' ? '#f5f3ef' : '#0a0a0a',
                      borderBottomRightRadius: item.author === 'customer' ? 2 : 8,
                      borderBottomLeftRadius: item.author === 'customer' ? 8 : 2,
                    }}
                  >
                    <p style={s.bubbleText}>{item.body}</p>
                    <p style={{ ...s.bubbleMeta, textAlign: item.author === 'customer' ? 'right' : 'left' }}>
                      {item.author === 'customer' ? 'YOU' : 'SUPPORT'} / {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {chatClosed ? (
                <div style={s.closedBox}>THIS SUPPORT CHAT HAS BEEN CLOSED.</div>
              ) : (
                <form onSubmit={sendReply} style={s.replyForm}>
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Type your reply..." style={{ ...s.input, resize: 'vertical' }} />
                  {notice && <div style={status === 'error' ? s.errorBox : s.successBox}>{notice}</div>}
                  <button type="submit" disabled={status === 'loading'} style={s.btn}>
                    {status === 'loading' ? 'SENDING...' : 'SEND REPLY'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={submit} style={s.form}>
              <TwoCol isMobile={isMobile}>
                <Field label="NAME" value={form.name} onChange={set('name')} required />
                <Field label="EMAIL" type="email" value={form.email} onChange={set('email')} required />
              </TwoCol>
              <TwoCol isMobile={isMobile}>
                <Field label="PHONE (OPTIONAL)" value={form.phone} onChange={set('phone')} />
                <Field label="ORDER NUMBER (OPTIONAL)" value={form.orderNumber} onChange={set('orderNumber')} />
              </TwoCol>
              <Field label="SUBJECT" value={form.subject} onChange={set('subject')} required />
              <Field label="MESSAGE" value={form.message} onChange={set('message')} textarea required />

              {notice && (
                <div style={status === 'error' ? s.errorBox : s.successBox}>{notice}</div>
              )}

              <button type="submit" disabled={status === 'loading'} style={s.btn}>
                {status === 'loading' ? 'SENDING...' : 'START SUPPORT CHAT'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function TwoCol({ children, isMobile }) {
  return <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text', textarea, required }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} required={required} rows={6} style={{ ...s.input, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={onChange} required={required} style={s.input} />
      )}
    </div>
  );
}

const s = {
  back: { display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', textDecoration: 'none', borderBottom: '1px solid #d0cdc9', marginBottom: 28 },
  eyebrow: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 3, color: '#888', marginBottom: 8 },
  title: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 10vw, 96px)', lineHeight: .9, marginBottom: 16 },
  copy: { fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 22 },
  infoBox: { border: '1px solid #d0cdc9', padding: 16 },
  infoLabel: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', marginTop: 10 },
  infoText: { fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#0a0a0a', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid #d0cdc9', padding: 18 },
  chatShell: { border: '1px solid #d0cdc9', background: '#f5f3ef', overflow: 'hidden' },
  chatHeader: { padding: 14, borderBottom: '1px solid #d0cdc9' },
  chatTitle: { fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, marginTop: 4 },
  thread: { display: 'flex', flexDirection: 'column', gap: 7, padding: 12, minHeight: 300, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', background: '#ede9e3' },
  bubble: { width: 'fit-content', maxWidth: 'min(78%, 560px)', padding: '8px 10px', border: '1px solid rgba(10,10,10,.08)', borderRadius: 8, boxShadow: '0 1px 1px rgba(10,10,10,.05)' },
  bubbleMeta: { fontFamily: 'Space Mono, monospace', fontSize: 7, letterSpacing: .8, opacity: .58, marginTop: 5 },
  bubbleText: { fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  replyForm: { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderTop: '1px solid #d0cdc9' },
  closedBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1.5, color: '#777', padding: 16, borderTop: '1px solid #d0cdc9', background: '#ede9e3' },
  label: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input: { width: '100%', border: '1px solid #d0cdc9', padding: '11px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, background: 'transparent', outline: 'none' },
  btn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, padding: '13px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer' },
  errorBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', padding: '10px 12px', border: '1px solid rgba(224,48,48,.25)', background: 'rgba(224,48,48,.06)' },
  successBox: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', padding: '10px 12px', border: '1px solid rgba(42,122,42,.25)', background: 'rgba(42,122,42,.06)' },
};
